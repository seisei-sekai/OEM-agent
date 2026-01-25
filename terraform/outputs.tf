output "instance_ip" {
  description = "External IP address of the VM instance"
  value       = google_compute_address.static.address
}

output "instance_name" {
  description = "Name of the VM instance"
  value       = google_compute_instance.app.name
}

output "frontend_url" {
  description = "URL to access the frontend"
  value       = "http://${google_compute_address.static.address}:3000"
}

output "api_url" {
  description = "URL to access the API"
  value       = "http://${google_compute_address.static.address}:3001"
}

output "ssh_command" {
  description = "Command to SSH into the VM"
  value       = "gcloud compute ssh ${google_compute_instance.app.name} --zone=${var.zone}"
}



