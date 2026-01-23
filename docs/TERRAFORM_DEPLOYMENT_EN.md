# Terraform GCP Deployment Guide (English)

**Created:** 2026-01-23  
**Last Updated:** 2026-01-23  
**Target Audience:** Developers deploying OEM Agent to Google Cloud Platform

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [GCP Project Setup](#gcp-project-setup)
3. [Terraform Configuration](#terraform-configuration)
4. [Deployment Steps](#deployment-steps)
5. [Verify Deployment](#verify-deployment)
6. [Management and Maintenance](#management-and-maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Local Tools

Ensure you have the following tools installed:

```bash
# 1. Terraform (Infrastructure as Code tool)
brew install terraform  # macOS
# or visit https://www.terraform.io/downloads

# Verify installation
terraform --version  # Should show v1.0 or higher

# 2. Google Cloud SDK (gcloud CLI)
brew install --cask google-cloud-sdk  # macOS
# or visit https://cloud.google.com/sdk/docs/install

# Verify installation
gcloud --version

# 3. Git
brew install git  # macOS
git --version
```

### GCP Account

- ✅ GCP account with billing enabled
- ✅ Permissions to create projects and Compute Engine resources
- ✅ Estimated cost: $20-50/month (depending on traffic)

---

## GCP Project Setup

### Step 1: Create GCP Project

```bash
# 1. Login to GCP
gcloud auth login

# 2. Create new project (Project ID must be globally unique)
export PROJECT_ID="oem-agent-prod-$(date +%s)"
gcloud projects create $PROJECT_ID --name="OEM Agent Production"

# 3. Set current project
gcloud config set project $PROJECT_ID

# 4. View project info
gcloud projects describe $PROJECT_ID
```

### Step 2: Enable Billing

```bash
# List available billing accounts
gcloud billing accounts list

# Link billing account to project (replace BILLING_ACCOUNT_ID)
export BILLING_ACCOUNT_ID="YOUR-BILLING-ACCOUNT-ID"
gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID

# Verify billing is enabled
gcloud billing projects describe $PROJECT_ID
```

### Step 3: Enable Required APIs

```bash
# Terraform will auto-enable, but can also enable manually
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
```

### Step 4: Create Service Account (for Terraform)

```bash
# 1. Create service account
gcloud iam service-accounts create terraform-sa \
  --display-name="Terraform Service Account"

# 2. Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:terraform-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/editor"

# 3. Create key file
gcloud iam service-accounts keys create ~/terraform-key.json \
  --iam-account=terraform-sa@$PROJECT_ID.iam.gserviceaccount.com

# 4. Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=~/terraform-key.json
```

---

## Terraform Configuration

### Step 1: Prepare Configuration Files

```bash
cd OEM_Agent/terraform

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars
```

### Step 2: Edit terraform.tfvars

```bash
# Open with your favorite editor
nano terraform.tfvars
```

Fill in the following:

```hcl
# terraform.tfvars

# ============================================
# GCP Project Configuration
# ============================================
project_id = "your-gcp-project-id"  # Replace with your project ID
region     = "asia-northeast1"      # Tokyo (recommended for low latency)
zone       = "asia-northeast1-a"    # Availability zone

# ============================================
# VM Configuration
# ============================================
instance_name  = "oem-agent-vm"
machine_type   = "e2-medium"        # 2 vCPU, 4 GB RAM (recommended)
                                    # or "e2-small" (1 vCPU, 2 GB) - cheaper but may lack performance
                                    # or "e2-standard-2" (2 vCPU, 8 GB) - better but more expensive
boot_disk_size = 30                 # GB (recommend 30GB+)

# ============================================
# Application Configuration
# ============================================
openai_api_key = "sk-your-openai-api-key-here"  # ⚠️ Required: Your OpenAI API Key
git_repo_url   = "https://github.com/your-username/OEM_Agent.git"  # Optional: For Git deployment
```

**Important Notes:**
- `project_id`: Must be the project ID created in Step 1
- `openai_api_key`: Get from https://platform.openai.com/api-keys
- `git_repo_url`: Leave empty for manual upload; fill to auto-pull from GitHub

### Step 3: Machine Type Selection Guide

| Machine Type | vCPU | RAM | Monthly Cost (Est.) | Use Case |
|-------------|------|-----|---------------------|----------|
| `e2-micro` | 0.25 | 1 GB | $6 | Testing/Demo (not for production) |
| `e2-small` | 0.5 | 2 GB | $12 | Light production (risky) |
| `e2-medium` | 1 | 4 GB | $24 | **Recommended for production** |
| `e2-standard-2` | 2 | 8 GB | $48 | High-traffic production |

**Recommended:** `e2-medium` (best value)

---

## Deployment Steps

### Step 1: Initialize Terraform

```bash
cd terraform

# Initialize (download Google Cloud provider plugin)
terraform init

# Validate configuration syntax
terraform validate
```

Expected output:
```
Success! The configuration is valid.
```

### Step 2: Preview Deployment Plan

```bash
# View resources to be created
terraform plan
```

You'll see output like:
```
Terraform will perform the following actions:

  # google_compute_address.static will be created
  + resource "google_compute_address" "static" {
      + address            = (known after apply)
      + name               = "oem-agent-ip"
      ...
    }

  # google_compute_firewall.api will be created
  + resource "google_compute_firewall" "api" {
      + name    = "oem-agent-api"
      + network = "default"
      + ports   = ["4000"]
      ...
    }

Plan: 5 to add, 0 to change, 0 to destroy.
```

### Step 3: Execute Deployment

```bash
# Start deployment (will ask for confirmation)
terraform apply

# Or auto-confirm (skip interaction)
terraform apply -auto-approve
```

**Deployment time:** ~5-10 minutes

### Step 4: Wait for Application Startup

After Terraform completes, the VM will automatically execute the startup script (`startup-script.sh`), which will:
1. Install Docker and Docker Compose
2. Clone Git repository (if provided)
3. Create `.env` file
4. Start all services (frontend, backend, MongoDB, Weaviate)

**Startup time:** ~3-5 minutes

View startup logs:

```bash
# Get VM external IP
export VM_IP=$(terraform output -raw external_ip 2>/dev/null || \
               gcloud compute instances describe oem-agent-vm \
               --zone=asia-northeast1-a \
               --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

# SSH to VM
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# View startup logs
sudo tail -f /var/log/startup-script.log

# Check Docker container status
cd /opt/oem-agent
docker-compose ps
```

---

## Verify Deployment

### Step 1: Get Access URLs

```bash
# Get external IP
terraform output external_ip

# Or use gcloud
gcloud compute instances describe oem-agent-vm \
  --zone=asia-northeast1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

If output is `35.200.123.45`, access URLs are:

- **Frontend Web**: http://35.200.123.45:3000
- **Backend API**: http://35.200.123.45:4000
- **API Health Check**: http://35.200.123.45:4000/health

### Step 2: Test Services

```bash
# Test API health check
curl http://$VM_IP:4000/health

# Expected output
{
  "status": "healthy",
  "timestamp": "2026-01-23T..."
}

# Test frontend (should return HTML)
curl http://$VM_IP:3000
```

### Step 3: Browser Access

Open in browser:
```
http://YOUR_VM_IP:3000
```

Click the **💬** button in bottom-right corner, test AI Agent:
1. Input website URL (e.g., `https://monoya.com`)
2. Confirm branding info
3. Click "🎨 Generate Mockup" button
4. View generated product mockup

---

## Management and Maintenance

### View VM Information

```bash
# List all instances
gcloud compute instances list

# View detailed info
gcloud compute instances describe oem-agent-vm \
  --zone=asia-northeast1-a
```

### Stop/Start VM

```bash
# Stop (save costs, but retain data)
gcloud compute instances stop oem-agent-vm \
  --zone=asia-northeast1-a

# Start
gcloud compute instances start oem-agent-vm \
  --zone=asia-northeast1-a
```

### Update Application Code

#### Method 1: Via Git (Recommended)

```bash
# SSH to VM
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# Pull latest code
cd /opt/oem-agent
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Exit SSH
exit
```

#### Method 2: Local Upload

```bash
# Compress local code
cd OEM_Agent
tar -czf oem-agent.tar.gz .

# Upload to VM
gcloud compute scp oem-agent.tar.gz oem-agent-vm:/tmp/ \
  --zone=asia-northeast1-a

# SSH to VM and deploy
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

cd /opt/oem-agent
tar -xzf /tmp/oem-agent.tar.gz
docker-compose down
docker-compose up -d --build
```

### View Logs

```bash
# SSH to VM
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# View all containers
cd /opt/oem-agent
docker-compose ps

# View API logs
docker-compose logs -f api

# View Web logs
docker-compose logs -f web

# View MongoDB logs
docker-compose logs -f mongodb
```

### Modify Configuration

```bash
# SSH to VM
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# Edit .env file
cd /opt/oem-agent
nano .env

# Restart services
docker-compose restart
```

### Destroy Resources (Delete All)

```bash
# ⚠️ Warning: This deletes all resources, data cannot be recovered
terraform destroy

# Or auto-confirm
terraform destroy -auto-approve
```

---

## Troubleshooting

### Issue 1: Terraform Initialization Failed

**Error:**
```
Error: Failed to query available provider packages
```

**Solution:**
```bash
# Clear cache
rm -rf .terraform .terraform.lock.hcl

# Re-initialize
terraform init
```

### Issue 2: Insufficient Permissions

**Error:**
```
Error: googleapi: Error 403: Compute Engine API has not been used
```

**Solution:**
```bash
# Enable API
gcloud services enable compute.googleapis.com

# Wait 1-2 minutes, then retry
terraform apply
```

### Issue 3: Firewall Rule Conflict

**Error:**
```
Error: Error creating Firewall: googleapi: Error 409: Already Exists
```

**Solution:**
```bash
# Delete existing firewall rules
gcloud compute firewall-rules delete oem-agent-http
gcloud compute firewall-rules delete oem-agent-api

# Re-deploy
terraform apply
```

### Issue 4: Service Inaccessible

**Symptom:** Accessing `http://VM_IP:3000` shows "Cannot reach"

**Debugging Steps:**

```bash
# 1. Confirm VM is running
gcloud compute instances list

# 2. SSH to VM
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 3. Check Docker container status
cd /opt/oem-agent
docker-compose ps

# 4. Check firewall rules
gcloud compute firewall-rules list | grep oem-agent

# 5. View startup script logs
sudo cat /var/log/startup-script.log

# 6. View container logs
docker-compose logs api
docker-compose logs web
```

---

## Cost Optimization

### 1. Use Preemptible VMs

Can save 60-80% costs, but VMs may be terminated anytime (suitable for dev environments).

Modify `main.tf`:

```hcl
resource "google_compute_instance" "app" {
  # ... other config

  scheduling {
    preemptible       = true
    automatic_restart = false
  }
}
```

### 2. Use Smaller Machine Type

If traffic is low, downgrade to `e2-small` ($12/month).

Modify `terraform.tfvars`:

```hcl
machine_type = "e2-small"
```

---

## Production Recommendations

### 1. Use Custom Domain

Purchase domain and configure DNS A record to VM IP:

```
A    @         35.200.123.45   # Frontend
A    api       35.200.123.45   # API
```

### 2. Configure HTTPS

Use Nginx + Let's Encrypt:

```bash
# SSH to VM
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# Install Nginx and Certbot
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/oem-agent

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### 3. Enable Automatic Backups

```bash
# Create snapshot schedule
gcloud compute disks snapshot-schedule create daily-backups \
  --region=asia-northeast1 \
  --schedule-daily

# Attach schedule to disk
gcloud compute disks add-resource-policies oem-agent-vm \
  --resource-policies=daily-backups \
  --zone=asia-northeast1-a
```

---

## Next Steps

- 🔒 [Configure HTTPS and Domain](./PRODUCTION_SETUP_EN.md)
- 📊 [Setup Monitoring and Logging](./MONITORING_GUIDE_EN.md)
- 🚀 [CI/CD Automation](./CICD_GUIDE_EN.md)
- 🔐 [Security Hardening Guide](./SECURITY_HARDENING_EN.md)

---

**Documentation Maintainer:** AI Cursor  
**Last Updated:** 2026-01-23  
**Feedback:** Please create a GitHub Issue

