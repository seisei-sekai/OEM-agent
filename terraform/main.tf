terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "compute" {
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "container" {
  service            = "container.googleapis.com"
  disable_on_destroy = false
}

# Static IP address
resource "google_compute_address" "static" {
  name   = "oem-agent-ip"
  region = var.region

  depends_on = [google_project_service.compute]
}

# Firewall rules
resource "google_compute_firewall" "http" {
  name    = "oem-agent-http"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80", "3000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["oem-agent"]

  depends_on = [google_project_service.compute]
}

resource "google_compute_firewall" "api" {
  name    = "oem-agent-api"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["4000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["oem-agent"]

  depends_on = [google_project_service.compute]
}

# Compute Engine VM instance
resource "google_compute_instance" "app" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["oem-agent"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = var.boot_disk_size
      type  = "pd-standard"
    }
  }

  network_interface {
    network = "default"

    access_config {
      nat_ip = google_compute_address.static.address
    }
  }

  metadata_startup_script = templatefile("${path.module}/startup-script.sh", {
    openai_api_key = var.openai_api_key
    git_repo_url   = var.git_repo_url
  })

  service_account {
    scopes = ["cloud-platform"]
  }

  allow_stopping_for_update = true

  depends_on = [
    google_project_service.compute,
    google_compute_firewall.http,
    google_compute_firewall.api
  ]

  lifecycle {
    create_before_destroy = true
  }
}

