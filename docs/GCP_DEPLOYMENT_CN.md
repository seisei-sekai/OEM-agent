# GCP 部署完整指南

**创建时间:** 2026-01-23-08:54 (东京时间)  
**最后更新:** 2026-01-23-08:54 (东京时间)  
**目的:** Google Cloud Platform 部署详细步骤

---

## 目录

1. [部署架构](#部署架构)
2. [准备工作](#准备工作)
3. [使用 Terraform 部署](#使用-terraform-部署)
4. [手动部署步骤](#手动部署步骤)
5. [配置域名和 HTTPS](#配置域名和-https)
6. [监控和维护](#监控和维护)
7. [成本估算](#成本估算)

---

## 部署架构

### 推荐架构 (生产环境)

```
                    Internet
                       │
                       ↓
              Cloud Load Balancer
              (HTTPS + SSL证书)
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ↓                             ↓
   Cloud Run                     Cloud Run
   (API Service)                (Web Service)
   自动扩缩容                     自动扩缩容
        │                             │
        └──────────────┬──────────────┘
                       ↓
              Cloud SQL for MongoDB
              (托管数据库服务)
                       │
                       ↓
              Cloud Storage
              (静态资源 + 备份)
```

### 简化架构 (开发/测试)

```
                    Internet
                       │
                       ↓
              Compute Engine VM
              (单个虚拟机)
                       │
        ┌──────────────┴──────────────┐
        │              │              │
        ↓              ↓              ↓
    API Service   Web Service   MongoDB
    (Docker)      (Docker)      (Docker)
```

---

## 准备工作

### 1. 创建 GCP 项目

```bash
# 安装 gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# 初始化
gcloud init

# 创建新项目
gcloud projects create oem-agent-prod --name="OEM Agent Production"

# 设置当前项目
gcloud config set project oem-agent-prod

# 启用计费
# 访问: https://console.cloud.google.com/billing
```

### 2. 启用必要的 API

```bash
# 启用所有需要的 API
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable servicenetworking.googleapis.com
```

### 3. 设置服务账号

```bash
# 创建服务账号
gcloud iam service-accounts create oem-agent-sa \
    --display-name="OEM Agent Service Account"

# 授予权限
gcloud projects add-iam-policy-binding oem-agent-prod \
    --member="serviceAccount:oem-agent-sa@oem-agent-prod.iam.gserviceaccount.com" \
    --role="roles/editor"

# 创建密钥
gcloud iam service-accounts keys create ~/oem-agent-key.json \
    --iam-account=oem-agent-sa@oem-agent-prod.iam.gserviceaccount.com

# 设置环境变量
export GOOGLE_APPLICATION_CREDENTIALS=~/oem-agent-key.json
```

### 4. 安装 Terraform

```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# 验证安装
terraform --version
```

---

## 使用 Terraform 部署

### 方案 A: 单 VM 部署 (推荐用于开发/测试)

#### 1. 准备 Terraform 配置

```bash
cd terraform

# 查看现有配置
cat main.tf
cat variables.tf
```

#### 2. 创建配置文件

```bash
# 复制示例配置
cp terraform.tfvars.example terraform.tfvars

# 编辑配置
nano terraform.tfvars
```

填入以下内容:
```hcl
# GCP 项目配置
project_id = "oem-agent-prod"
region     = "asia-northeast1"  # 东京
zone       = "asia-northeast1-a"

# VM 配置
machine_type = "e2-medium"      # 2 vCPU, 4GB RAM
disk_size_gb = 30

# 网络配置
app_port     = 4000
web_port     = 3000
mongodb_port = 27018

# 应用配置
app_name = "oem-agent"

# 环境变量
openai_api_key = "sk-your-actual-api-key-here"
mongodb_db_name = "oem_agent"

# 标签
labels = {
  environment = "production"
  app         = "oem-agent"
  managed_by  = "terraform"
}
```

#### 3. 初始化 Terraform

```bash
# 初始化
terraform init

# 验证配置
terraform validate

# 格式化代码
terraform fmt
```

#### 4. 预览部署

```bash
# 查看将要创建的资源
terraform plan

# 输出示例:
# + google_compute_instance.vm
# + google_compute_firewall.allow_http
# + google_compute_firewall.allow_https
# + google_compute_address.static_ip
```

#### 5. 执行部署

```bash
# 部署
terraform apply

# 确认
# 输入: yes

# 等待部署完成 (约 5-10 分钟)
```

#### 6. 获取部署信息

```bash
# 查看输出
terraform output

# 示例输出:
# instance_ip = "35.200.123.456"
# instance_name = "oem-agent-vm"
# ssh_command = "gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a"
# web_url = "http://35.200.123.456:3000"
# api_url = "http://35.200.123.456:4000"
```

#### 7. 验证部署

```bash
# 获取 IP
INSTANCE_IP=$(terraform output -raw instance_ip)

# 测试 API
curl http://$INSTANCE_IP:4000/health

# 测试前端
open http://$INSTANCE_IP:3000

# SSH 到服务器
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 在服务器上检查
sudo systemctl status oem-agent
sudo journalctl -u oem-agent -f
docker ps
```

### 方案 B: Cloud Run 部署 (推荐用于生产)

#### 1. 构建和推送 Docker 镜像

```bash
# 设置项目 ID
export PROJECT_ID=oem-agent-prod

# 配置 Docker
gcloud auth configure-docker

# 构建 API 镜像
docker build -f apps/api/Dockerfile \
  -t gcr.io/$PROJECT_ID/oem-api:latest \
  -t gcr.io/$PROJECT_ID/oem-api:v1.0.0 \
  .

# 构建 Web 镜像
docker build -f apps/web/Dockerfile \
  -t gcr.io/$PROJECT_ID/oem-web:latest \
  -t gcr.io/$PROJECT_ID/oem-web:v1.0.0 \
  .

# 推送镜像
docker push gcr.io/$PROJECT_ID/oem-api:latest
docker push gcr.io/$PROJECT_ID/oem-api:v1.0.0
docker push gcr.io/$PROJECT_ID/oem-web:latest
docker push gcr.io/$PROJECT_ID/oem-web:v1.0.0
```

#### 2. 创建 MongoDB (使用 MongoDB Atlas)

```bash
# 1. 访问 https://cloud.mongodb.com/
# 2. 创建账号并登录
# 3. 创建新集群:
#    - 选择 GCP
#    - 选择 asia-northeast1 (东京)
#    - 选择 M0 (免费) 或 M10 (生产)
# 4. 创建数据库用户
# 5. 添加 IP 白名单: 0.0.0.0/0 (允许所有 Cloud Run IP)
# 6. 获取连接字符串

# 连接字符串示例:
# mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/oem_agent?retryWrites=true&w=majority
```

#### 3. 部署到 Cloud Run

```bash
# 部署 API
gcloud run deploy oem-api \
  --image gcr.io/$PROJECT_ID/oem-api:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/oem_agent,OPENAI_API_KEY=sk-xxx,NODE_ENV=production"

# 获取 API URL
API_URL=$(gcloud run services describe oem-api \
  --region asia-northeast1 \
  --format 'value(status.url)')

echo "API URL: $API_URL"

# 部署 Web
gcloud run deploy oem-web \
  --image gcr.io/$PROJECT_ID/oem-web:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NEXT_PUBLIC_API_URL=$API_URL"

# 获取 Web URL
WEB_URL=$(gcloud run services describe oem-web \
  --region asia-northeast1 \
  --format 'value(status.url)')

echo "Web URL: $WEB_URL"
```

#### 4. 初始化数据库

```bash
# 方式 1: 本地运行初始化脚本
MONGODB_URL="mongodb+srv://..." node packages/infrastructure/dist/scripts/seed-simple.js

# 方式 2: 在 Cloud Run 上运行一次性任务
gcloud run jobs create seed-database \
  --image gcr.io/$PROJECT_ID/oem-api:latest \
  --region asia-northeast1 \
  --set-env-vars "MONGODB_URL=mongodb+srv://..." \
  --command "node" \
  --args "packages/infrastructure/dist/scripts/seed-simple.js"

gcloud run jobs execute seed-database --region asia-northeast1
```

---

## 手动部署步骤

### 1. 创建 VM 实例

```bash
# 创建静态 IP
gcloud compute addresses create oem-agent-ip \
  --region asia-northeast1

# 获取静态 IP
STATIC_IP=$(gcloud compute addresses describe oem-agent-ip \
  --region asia-northeast1 \
  --format 'value(address)')

echo "Static IP: $STATIC_IP"

# 创建 VM
gcloud compute instances create oem-agent-vm \
  --zone=asia-northeast1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --address=$STATIC_IP \
  --tags=http-server,https-server \
  --metadata=startup-script='#!/bin/bash
    apt-get update
    apt-get install -y docker.io docker-compose
    systemctl start docker
    systemctl enable docker
    usermod -aG docker $USER
  '

# 创建防火墙规则
gcloud compute firewall-rules create allow-http \
  --allow tcp:80,tcp:3000,tcp:4000 \
  --target-tags http-server

gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --target-tags https-server
```

### 2. 配置 VM

```bash
# SSH 到 VM
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 在 VM 上执行以下命令:

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
sudo npm install -g pnpm

# 克隆代码
git clone https://github.com/your-repo/OEM_Agent.git
cd OEM_Agent

# 安装依赖
pnpm install

# 配置环境变量
cp env.template .env
nano .env  # 填入实际配置

# 构建
pnpm build

# 启动服务
./start-demo.sh
```

### 3. 设置系统服务

```bash
# 创建 systemd 服务文件
sudo nano /etc/systemd/system/oem-agent.service
```

填入以下内容:
```ini
[Unit]
Description=OEM Agent Application
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/OEM_Agent
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
Environment="NODE_ENV=production"
ExecStart=/home/ubuntu/OEM_Agent/start-demo.sh
ExecStop=/home/ubuntu/OEM_Agent/stop-demo.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务:
```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start oem-agent

# 设置开机自启
sudo systemctl enable oem-agent

# 查看状态
sudo systemctl status oem-agent

# 查看日志
sudo journalctl -u oem-agent -f
```

---

## 配置域名和 HTTPS

### 1. 配置域名

```bash
# 假设你有域名: oem-agent.com

# 添加 DNS 记录:
# A 记录: @ -> 35.200.123.456 (你的 VM IP)
# A 记录: www -> 35.200.123.456
# A 记录: api -> 35.200.123.456
```

### 2. 安装 SSL 证书 (Let's Encrypt)

```bash
# SSH 到 VM
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 安装 Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# 安装 Nginx
sudo apt-get install -y nginx

# 配置 Nginx
sudo nano /etc/nginx/sites-available/oem-agent
```

Nginx 配置:
```nginx
# API 服务
server {
    listen 80;
    server_name api.oem-agent.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Web 服务
server {
    listen 80;
    server_name oem-agent.com www.oem-agent.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置:
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/oem-agent /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 获取 SSL 证书
sudo certbot --nginx -d oem-agent.com -d www.oem-agent.com -d api.oem-agent.com

# 设置自动续期
sudo certbot renew --dry-run
```

### 3. 配置 Cloud Run 自定义域名

```bash
# 添加域名映射
gcloud run domain-mappings create \
  --service oem-web \
  --domain oem-agent.com \
  --region asia-northeast1

gcloud run domain-mappings create \
  --service oem-api \
  --domain api.oem-agent.com \
  --region asia-northeast1

# 查看需要添加的 DNS 记录
gcloud run domain-mappings describe \
  --domain oem-agent.com \
  --region asia-northeast1
```

---

## 监控和维护

### 1. 设置日志

```bash
# 查看 Cloud Run 日志
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 \
  --format json

# 查看 VM 日志
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a \
  --command "sudo journalctl -u oem-agent -n 100"

# 实时日志
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=oem-api"
```

### 2. 设置监控

```bash
# 创建告警策略
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="API High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s

# 创建正常运行时间检查
gcloud monitoring uptime-checks create \
  --display-name="OEM API Health Check" \
  --http-check-path="/health" \
  --http-check-port=443 \
  --monitored-resource-type="uptime_url" \
  --monitored-resource-host="api.oem-agent.com"
```

### 3. 备份策略

```bash
# MongoDB 备份 (如果使用 MongoDB Atlas)
# Atlas 自动每天备份

# 如果自托管 MongoDB:
# 创建备份脚本
cat > backup-mongodb.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec mongodb mongodump --out=/dump
docker cp mongodb:/dump $BACKUP_DIR/mongodb_$DATE

# 上传到 Cloud Storage
gsutil -m cp -r $BACKUP_DIR/mongodb_$DATE gs://oem-agent-backups/

# 清理旧备份 (保留最近 7 天)
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x backup-mongodb.sh

# 添加到 crontab (每天凌晨 2 点)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup-mongodb.sh") | crontab -
```

### 4. 更新部署

```bash
# 方式 1: 使用 Terraform
cd terraform
terraform apply

# 方式 2: 手动更新 Cloud Run
# 构建新镜像
docker build -f apps/api/Dockerfile -t gcr.io/$PROJECT_ID/oem-api:v1.1.0 .
docker push gcr.io/$PROJECT_ID/oem-api:v1.1.0

# 更新服务
gcloud run services update oem-api \
  --image gcr.io/$PROJECT_ID/oem-api:v1.1.0 \
  --region asia-northeast1

# 方式 3: 更新 VM
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

cd OEM_Agent
git pull
pnpm install
pnpm build
sudo systemctl restart oem-agent
```

### 5. 回滚

```bash
# Cloud Run 回滚
gcloud run services update-traffic oem-api \
  --to-revisions=oem-api-00001-abc=100 \
  --region asia-northeast1

# VM 回滚
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

cd OEM_Agent
git log --oneline  # 查看提交历史
git checkout <previous-commit-hash>
pnpm install
pnpm build
sudo systemctl restart oem-agent
```

---

## 成本估算

### Cloud Run 方案 (推荐)

**每月成本估算** (假设中等流量):

| 服务 | 配置 | 月成本 (USD) |
|------|------|-------------|
| Cloud Run API | 1GB RAM, 2 vCPU, 100万请求 | $24.00 |
| Cloud Run Web | 512MB RAM, 1 vCPU, 50万请求 | $8.00 |
| MongoDB Atlas | M10 (2GB RAM) | $57.00 |
| Cloud Storage | 10GB | $0.20 |
| Cloud Load Balancer | 基础 | $18.00 |
| **总计** | | **~$107/月** |

**免费额度**:
- Cloud Run: 每月 200 万请求免费
- Cloud Storage: 5GB 免费
- 出站流量: 1GB/月免费

### VM 方案

**每月成本估算**:

| 服务 | 配置 | 月成本 (USD) |
|------|------|-------------|
| Compute Engine | e2-medium (2 vCPU, 4GB) | $24.27 |
| 持久化磁盘 | 30GB SSD | $5.10 |
| 静态 IP | 1个 | $7.30 |
| 出站流量 | ~100GB | $12.00 |
| **总计** | | **~$49/月** |

### 成本优化建议

1. **使用 Preemptible VMs** (可节省 60-80%)
   ```bash
   gcloud compute instances create oem-agent-vm \
     --preemptible \
     --maintenance-policy TERMINATE
   ```

2. **启用 Cloud CDN** (减少出站流量)
   ```bash
   gcloud compute backend-services update oem-backend \
     --enable-cdn
   ```

3. **使用 Cloud Run 最小实例数 = 0** (按需付费)

4. **设置预算告警**
   ```bash
   gcloud billing budgets create \
     --billing-account=BILLING_ACCOUNT_ID \
     --display-name="OEM Agent Budget" \
     --budget-amount=100USD
   ```

---

## 故障排除

### 常见问题

**Q: Cloud Run 启动超时?**
```bash
# 增加超时时间
gcloud run services update oem-api \
  --timeout 300 \
  --region asia-northeast1
```

**Q: MongoDB 连接失败?**
```bash
# 检查 IP 白名单
# MongoDB Atlas -> Network Access -> Add IP Address -> 0.0.0.0/0

# 测试连接
mongosh "mongodb+srv://cluster.mongodb.net/test" --username user
```

**Q: 静态 IP 无法访问?**
```bash
# 检查防火墙规则
gcloud compute firewall-rules list

# 添加规则
gcloud compute firewall-rules create allow-all-http \
  --allow tcp:80,tcp:443,tcp:3000,tcp:4000 \
  --source-ranges 0.0.0.0/0
```

**Q: SSL 证书续期失败?**
```bash
# 手动续期
sudo certbot renew --force-renewal

# 检查 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 总结

### 部署检查清单

- [ ] GCP 项目已创建并启用计费
- [ ] 所有必要的 API 已启用
- [ ] 服务账号已创建并配置
- [ ] Terraform 已安装并初始化
- [ ] 环境变量已正确配置
- [ ] Docker 镜像已构建并推送
- [ ] 数据库已创建并初始化
- [ ] 应用已部署并可访问
- [ ] 域名已配置 (如果需要)
- [ ] SSL 证书已安装 (如果需要)
- [ ] 监控和告警已设置
- [ ] 备份策略已实施

### 下一步

1. 设置 CI/CD 管道
2. 配置自动扩缩容
3. 实施灾难恢复计划
4. 优化性能和成本
5. 加强安全措施

---

**部署愉快！🚀**


