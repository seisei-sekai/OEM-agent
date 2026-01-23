# Terraform GCP 部署指南（中文版）

**创建时间：** 2026-01-23  
**最后更新：** 2026-01-23  
**目标读者：** 想要将 OEM Agent 部署到 Google Cloud Platform 的开发者

---

## 📋 目录

1. [前置准备](#前置准备)
2. [GCP 项目设置](#gcp-项目设置)
3. [Terraform 配置](#terraform-配置)
4. [部署步骤](#部署步骤)
5. [验证部署](#验证部署)
6. [管理和维护](#管理和维护)
7. [故障排除](#故障排除)

---

## 前置准备

### 本地工具

确保已安装以下工具：

```bash
# 1. Terraform（基础设施即代码工具）
brew install terraform  # macOS
# 或访问 https://www.terraform.io/downloads

# 验证安装
terraform --version  # 应显示 v1.0 或更高版本

# 2. Google Cloud SDK（gcloud CLI）
brew install --cask google-cloud-sdk  # macOS
# 或访问 https://cloud.google.com/sdk/docs/install

# 验证安装
gcloud --version

# 3. Git
brew install git  # macOS
git --version
```

### GCP 账号

- ✅ 已绑定信用卡的 GCP 账号
- ✅ 有创建项目和 Compute Engine 权限
- ✅ 预计费用：$20-50/月（取决于流量）

---

## GCP 项目设置

### Step 1: 创建 GCP 项目

```bash
# 1. 登录 GCP
gcloud auth login

# 2. 创建新项目（项目 ID 必须全局唯一）
export PROJECT_ID="oem-agent-prod-$(date +%s)"
gcloud projects create $PROJECT_ID --name="OEM Agent Production"

# 3. 设置当前项目
gcloud config set project $PROJECT_ID

# 4. 查看项目信息
gcloud projects describe $PROJECT_ID
```

### Step 2: 启用计费

```bash
# 查看可用的计费账户
gcloud billing accounts list

# 将计费账户链接到项目（替换 BILLING_ACCOUNT_ID）
export BILLING_ACCOUNT_ID="YOUR-BILLING-ACCOUNT-ID"
gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID

# 验证计费已启用
gcloud billing projects describe $PROJECT_ID
```

### Step 3: 启用必要的 API

```bash
# Terraform 会自动启用，但也可以手动启用
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
```

### Step 4: 创建服务账号（用于 Terraform）

```bash
# 1. 创建服务账号
gcloud iam service-accounts create terraform-sa \
  --display-name="Terraform Service Account"

# 2. 授予权限
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:terraform-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/editor"

# 3. 创建密钥文件
gcloud iam service-accounts keys create ~/terraform-key.json \
  --iam-account=terraform-sa@$PROJECT_ID.iam.gserviceaccount.com

# 4. 设置环境变量
export GOOGLE_APPLICATION_CREDENTIALS=~/terraform-key.json
```

---

## Terraform 配置

### Step 1: 准备配置文件

```bash
cd OEM_Agent/terraform

# 复制示例配置文件
cp terraform.tfvars.example terraform.tfvars
```

### Step 2: 编辑 terraform.tfvars

```bash
# 使用你喜欢的编辑器打开
nano terraform.tfvars
```

填入以下内容：

```hcl
# terraform.tfvars

# ============================================
# GCP 项目配置
# ============================================
project_id = "your-gcp-project-id"  # 替换为你的项目 ID
region     = "asia-northeast1"      # 东京（推荐，延迟低）
zone       = "asia-northeast1-a"    # 可用区

# ============================================
# 虚拟机配置
# ============================================
instance_name  = "oem-agent-vm"
machine_type   = "e2-medium"        # 2 vCPU, 4 GB 内存（推荐）
                                    # 或 "e2-small" (1 vCPU, 2 GB) - 便宜但可能性能不足
                                    # 或 "e2-standard-2" (2 vCPU, 8 GB) - 更好但更贵
boot_disk_size = 30                 # GB（建议 30GB 以上）

# ============================================
# 应用配置
# ============================================
openai_api_key = "sk-your-openai-api-key-here"  # ⚠️ 必填：你的 OpenAI API Key
git_repo_url   = "https://github.com/your-username/OEM_Agent.git"  # 可选：如果想从 Git 部署
```

**重要说明：**
- `project_id`: 必须是你在 Step 1 创建的项目 ID
- `openai_api_key`: 从 https://platform.openai.com/api-keys 获取
- `git_repo_url`: 留空则需要手动上传代码；填写则自动从 GitHub 拉取

### Step 3: 机器类型选择指南

| 机器类型 | vCPU | 内存 | 月费用（估算） | 适用场景 |
|---------|------|------|---------------|---------|
| `e2-micro` | 0.25 | 1 GB | $6 | 测试/演示（不推荐生产） |
| `e2-small` | 0.5 | 2 GB | $12 | 轻量生产（有风险） |
| `e2-medium` | 1 | 4 GB | $24 | **推荐生产环境** |
| `e2-standard-2` | 2 | 8 GB | $48 | 高流量生产 |

**推荐：** `e2-medium`（性价比最高）

---

## 部署步骤

### Step 1: 初始化 Terraform

```bash
cd terraform

# 初始化（下载 Google Cloud 提供商插件）
terraform init

# 验证配置文件语法
terraform validate
```

预期输出：
```
Success! The configuration is valid.
```

### Step 2: 预览部署计划

```bash
# 查看将要创建的资源
terraform plan
```

你会看到类似这样的输出：
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

  # google_compute_firewall.http will be created
  ...

  # google_compute_instance.app will be created
  ...

Plan: 5 to add, 0 to change, 0 to destroy.
```

### Step 3: 执行部署

```bash
# 开始部署（会要求确认）
terraform apply

# 或者自动确认（跳过交互）
terraform apply -auto-approve
```

**部署时间：** 约 5-10 分钟

### Step 4: 等待应用启动

Terraform 部署完成后，虚拟机会自动执行启动脚本（`startup-script.sh`），该脚本会：
1. 安装 Docker 和 Docker Compose
2. 克隆 Git 仓库（如果提供了）
3. 创建 `.env` 文件
4. 启动所有服务（前端、后端、MongoDB、Weaviate）

**启动时间：** 约 3-5 分钟

查看启动日志：

```bash
# 获取虚拟机的外部 IP
export VM_IP=$(terraform output -raw external_ip 2>/dev/null || \
               gcloud compute instances describe oem-agent-vm \
               --zone=asia-northeast1-a \
               --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

# SSH 到虚拟机
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 查看启动日志
sudo tail -f /var/log/startup-script.log

# 查看 Docker 容器状态
cd /opt/oem-agent
docker-compose ps
```

---

## 验证部署

### Step 1: 获取访问地址

```bash
# 获取外部 IP
terraform output external_ip

# 或使用 gcloud
gcloud compute instances describe oem-agent-vm \
  --zone=asia-northeast1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

假设输出为 `35.200.123.45`，那么访问地址为：

- **前端 Web**: http://35.200.123.45:3000
- **后端 API**: http://35.200.123.45:4000
- **API 健康检查**: http://35.200.123.45:4000/health

### Step 2: 测试服务

```bash
# 测试 API 健康检查
curl http://$VM_IP:4000/health

# 预期输出
{
  "status": "healthy",
  "timestamp": "2026-01-23T..."
}

# 测试前端（应返回 HTML）
curl http://$VM_IP:3000
```

### Step 3: 浏览器访问

在浏览器中打开：
```
http://YOUR_VM_IP:3000
```

点击右下角的 **💬** 按钮，测试 AI Agent：
1. 输入网站 URL（如 `https://monoya.com`）
2. 确认品牌信息
3. 点击 "🎨 Generate Mockup" 按钮
4. 查看生成的产品效果图

---

## 管理和维护

### 查看虚拟机信息

```bash
# 查看所有实例
gcloud compute instances list

# 查看详细信息
gcloud compute instances describe oem-agent-vm \
  --zone=asia-northeast1-a
```

### 停止/启动虚拟机

```bash
# 停止（节省费用，但数据保留）
gcloud compute instances stop oem-agent-vm \
  --zone=asia-northeast1-a

# 启动
gcloud compute instances start oem-agent-vm \
  --zone=asia-northeast1-a
```

### 更新应用代码

#### 方法 1: 通过 Git（推荐）

```bash
# SSH 到虚拟机
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 拉取最新代码
cd /opt/oem-agent
git pull

# 重新构建并启动
docker-compose down
docker-compose up -d --build

# 退出 SSH
exit
```

#### 方法 2: 本地上传

```bash
# 压缩本地代码
cd OEM_Agent
tar -czf oem-agent.tar.gz .

# 上传到虚拟机
gcloud compute scp oem-agent.tar.gz oem-agent-vm:/tmp/ \
  --zone=asia-northeast1-a

# SSH 到虚拟机并部署
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

cd /opt/oem-agent
tar -xzf /tmp/oem-agent.tar.gz
docker-compose down
docker-compose up -d --build
```

### 查看日志

```bash
# SSH 到虚拟机
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 查看所有容器
cd /opt/oem-agent
docker-compose ps

# 查看 API 日志
docker-compose logs -f api

# 查看 Web 日志
docker-compose logs -f web

# 查看 MongoDB 日志
docker-compose logs -f mongodb
```

### 修改配置

```bash
# SSH 到虚拟机
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 编辑 .env 文件
cd /opt/oem-agent
nano .env

# 重启服务
docker-compose restart
```

### 销毁资源（删除所有）

```bash
# ⚠️ 警告：这会删除所有资源，数据无法恢复
terraform destroy

# 或自动确认
terraform destroy -auto-approve
```

---

## 故障排除

### 问题 1: Terraform 初始化失败

**错误：**
```
Error: Failed to query available provider packages
```

**解决：**
```bash
# 清理缓存
rm -rf .terraform .terraform.lock.hcl

# 重新初始化
terraform init
```

### 问题 2: 权限不足

**错误：**
```
Error: googleapi: Error 403: Compute Engine API has not been used
```

**解决：**
```bash
# 启用 API
gcloud services enable compute.googleapis.com

# 等待 1-2 分钟，然后重试
terraform apply
```

### 问题 3: 防火墙规则冲突

**错误：**
```
Error: Error creating Firewall: googleapi: Error 409: Already Exists
```

**解决：**
```bash
# 删除现有防火墙规则
gcloud compute firewall-rules delete oem-agent-http
gcloud compute firewall-rules delete oem-agent-api

# 重新部署
terraform apply
```

### 问题 4: 服务无法访问

**症状：** 访问 `http://VM_IP:3000` 显示"无法访问"

**检查步骤：**

```bash
# 1. 确认虚拟机正在运行
gcloud compute instances list

# 2. SSH 到虚拟机
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 3. 检查 Docker 容器状态
cd /opt/oem-agent
docker-compose ps

# 4. 检查防火墙规则
gcloud compute firewall-rules list | grep oem-agent

# 5. 查看启动脚本日志
sudo cat /var/log/startup-script.log

# 6. 查看容器日志
docker-compose logs api
docker-compose logs web
```

### 问题 5: OpenAI API 错误

**错误日志：**
```
OpenAIError: The OPENAI_API_KEY environment variable is missing
```

**解决：**
```bash
# SSH 到虚拟机
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 检查 .env 文件
cd /opt/oem-agent
cat .env | grep OPENAI_API_KEY

# 如果缺失，手动添加
echo "OPENAI_API_KEY=sk-your-key-here" >> .env

# 重启服务
docker-compose restart
```

### 问题 6: 数据库连接失败

**错误：** MongoDB 连接超时

**解决：**
```bash
# SSH 到虚拟机
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 检查 MongoDB 容器
docker ps | grep mongo

# 重启 MongoDB
cd /opt/oem-agent
docker-compose restart mongodb

# 查看日志
docker-compose logs mongodb
```

---

## 成本优化

### 1. 使用抢占式虚拟机（Preemptible VM）

可节省 60-80% 费用，但虚拟机可能随时被回收（适合开发环境）。

修改 `main.tf`：

```hcl
resource "google_compute_instance" "app" {
  # ... 其他配置

  scheduling {
    preemptible       = true
    automatic_restart = false
  }
}
```

### 2. 使用较小的机器类型

如果流量不大，可以降级为 `e2-small`（月费 $12）。

修改 `terraform.tfvars`：

```hcl
machine_type = "e2-small"
```

### 3. 定时关闭虚拟机

使用 Cloud Scheduler 在非工作时间自动关闭虚拟机。

```bash
# 创建关闭任务（每天晚上 10 点）
gcloud scheduler jobs create app-engine shutdown-vm \
  --schedule="0 22 * * *" \
  --http-method=POST \
  --uri="https://compute.googleapis.com/compute/v1/projects/$PROJECT_ID/zones/asia-northeast1-a/instances/oem-agent-vm/stop"

# 创建启动任务（每天早上 8 点）
gcloud scheduler jobs create app-engine startup-vm \
  --schedule="0 8 * * *" \
  --http-method=POST \
  --uri="https://compute.googleapis.com/compute/v1/projects/$PROJECT_ID/zones/asia-northeast1-a/instances/oem-agent-vm/start"
```

---

## 生产环境建议

### 1. 使用域名

购买域名并配置 DNS A 记录指向虚拟机 IP：

```
A    @         35.200.123.45   # 前端
A    api       35.200.123.45   # API
```

### 2. 配置 HTTPS

使用 Nginx + Let's Encrypt：

```bash
# SSH 到虚拟机
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 安装 Nginx 和 Certbot
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 配置 Nginx（参考 Template/nginx.conf）
sudo nano /etc/nginx/sites-available/oem-agent

# 获取 SSL 证书
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### 3. 启用自动备份

```bash
# 创建快照调度
gcloud compute disks snapshot-schedule create daily-backups \
  --region=asia-northeast1 \
  --schedule-daily

# 将快照调度附加到磁盘
gcloud compute disks add-resource-policies oem-agent-vm \
  --resource-policies=daily-backups \
  --zone=asia-northeast1-a
```

### 4. 设置监控告警

在 GCP Console 中配置：
- CPU 使用率告警（> 80%）
- 磁盘使用率告警（> 80%）
- 服务健康检查告警

---

## 下一步

- 🔒 [配置 HTTPS 和域名](./PRODUCTION_SETUP_CN.md)
- 📊 [设置监控和日志](./MONITORING_GUIDE_CN.md)
- 🚀 [CI/CD 自动部署](./CICD_GUIDE_CN.md)
- 🔐 [安全加固指南](./SECURITY_HARDENING_CN.md)

---

**文档维护者：** AI Cursor  
**最后更新：** 2026-01-23  
**反馈：** 请创建 GitHub Issue

