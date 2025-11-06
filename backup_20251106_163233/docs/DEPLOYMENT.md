# 🚀 Deployment Guide - LlamaRunner Pro

## Overview

This guide covers deploying LlamaRunner Pro in various environments, from local development to production-scale deployments.

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 4-core x64 processor
- **RAM**: 8 GB (4 GB for system, 4 GB for models)
- **Storage**: 10 GB free space
- **OS**: Windows 10/11, Ubuntu 20.04+, macOS 11+

#### Recommended for Production
- **CPU**: 8+ cores, high clock speed
- **RAM**: 32+ GB for multiple large models
- **GPU**: NVIDIA RTX 3070+ or equivalent (optional)
- **Storage**: 100+ GB NVMe SSD
- **OS**: Ubuntu 22.04 LTS or Windows Server 2022

### Dependencies

#### Python Environment
```bash
# Python 3.11+ required
python --version  # Should be 3.11+

# Create virtual environment
python -m venv dev-venv
source dev-venv/bin/activate  # Linux/MacOS
dev-venv\Scripts\Activate.ps1  # Windows PowerShell

# Install dependencies
pip install -r requirements.txt
```

#### System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y build-essential cmake python3-dev libsndfile1-dev
```

**CentOS/RHEL:**
```bash
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3-devel cmake libsndfile-devel
```

**Windows:**
```powershell
# Install Visual Studio Build Tools
# Install Windows SDK
# Install CMake
```

## Development Deployment

### Local Development Setup

1. **Clone and Setup**
```bash
git clone <repository-url>
cd llama-runner-async-proxy

# Create virtual environment
python -m venv dev-venv
source dev-venv/bin/activate

# Install in development mode
pip install -e .
```

2. **Configuration**
```bash
# Create configuration directory
mkdir -p ~/.llama-runner

# Copy example configuration
cp config_prefilled.json ~/.llama-runner/config.json

# Edit configuration
nano ~/.llama-runner/config.json
```

3. **Development Server**
```bash
# Start with GUI
python main.py

# Start headless (for API testing)
python main.py --headless

# With debug logging
python main.py --log-level DEBUG

# Skip config validation (for testing)
python main.py --headless --skip-validation
```

### Development with Dashboard

1. **Frontend Setup**
```bash
cd dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

2. **Backend Integration**
```bash
# Start backend in separate terminal
python main.py --headless

# Dashboard available at http://localhost:3000
# APIs available at http://localhost:1234 (LM Studio) and http://localhost:11434 (Ollama)
```

## Production Deployment

### Standalone Proxy Deployment

#### Linux Server Setup

1. **Create Service User**
```bash
sudo useradd -r -s /bin/false llama-runner
sudo mkdir -p /opt/llama-runner
sudo chown llama-runner:llama-runner /opt/llama-runner
```

2. **Install Application**
```bash
# As llama-runner user
sudo -u llama-runner bash

# Copy application files
cd /opt/llama-runner
# Copy your application files here

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

3. **Create Systemd Service**
```bash
# Create service file
sudo tee /etc/systemd/system/llama-runner.service > /dev/null <<EOF
[Unit]
Description=LlamaRunner Pro AI Proxy
After=network.target
Wants=network.target

[Service]
Type=simple
User=llama-runner
Group=llama-runner
WorkingDirectory=/opt/llama-runner
Environment=LLAMA_RUNNER_HEADLESS=true
Environment=LLAMA_RUNNER_LOG_LEVEL=INFO
ExecStart=/opt/llama-runner/venv/bin/python main.py --headless
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/llama-runner /tmp /var/log

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable llama-runner
sudo systemctl start llama-runner

# Check status
sudo systemctl status llama-runner
sudo journalctl -u llama-runner -f
```

4. **Production Configuration**
```bash
# Create production config
sudo -u llama-runner mkdir -p ~/.llama-runner

sudo tee ~/.llama-runner/config.json > /dev/null <<'EOF'
{
  "environment": "production",
  "logging": {
    "level": "INFO",
    "console": false,
    "file": true,
    "file_path": "/var/log/llama-runner.log"
  },
  "proxies": {
    "ollama": {
      "enabled": true,
      "port": 11434,
      "host": "127.0.0.1"
    },
    "lmstudio": {
      "enabled": true,
      "port": 1234,
      "host": "127.0.0.1"
    }
  },
  "security": {
    "authentication": {
      "enabled": false
    },
    "rate_limit": {
      "requests_per_minute": 1000
    }
  },
  "performance": {
    "memory": {
      "max_model_memory_mb": 16384
    },
    "concurrency": {
      "max_concurrent_models": 3
    }
  }
}
EOF
```

#### Windows Server Deployment

1. **Create Windows Service**
```powershell
# Install pywin32 for Windows service
pip install pywin32

# Create service script
# Save as service.py (see Windows Service section below)
python service.py install
net start llama-runner
```

2. **Firewall Configuration**
```powershell
# Allow proxy ports through firewall
New-NetFirewallRule -DisplayName "LlamaRunner Ollama" -Direction Inbound -Protocol TCP -LocalPort 11434 -Action Allow
New-NetFirewallRule -DisplayName "LlamaRunner LM Studio" -Direction Inbound -Protocol TCP -LocalPort 1234 -Action Allow
```

### Docker Deployment

#### Dockerfile
```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libsndfile1-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -r -s /bin/false llama-runner
RUN chown -R llama-runner:llama-runner /app
USER llama-runner

# Expose proxy ports
EXPOSE 1234 11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:1234/health || exit 1

# Start application
CMD ["python", "main.py", "--headless"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  llama-runner:
    build: .
    container_name: llama-runner-pro
    ports:
      - "1234:1234"  # LM Studio proxy
      - "11434:11434"  # Ollama proxy
    volumes:
      - ./config:/home/llama-runner/.llama-runner:ro
      - ./models:/models:ro
      - llama-runner-logs:/var/log
    environment:
      - LLAMA_RUNNER_LOG_LEVEL=INFO
      - LLAMA_RUNNER_ENABLE_AUDIO=true
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:1234/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  llama-runner-logs:
```

#### Docker Deployment Commands
```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f llama-runner

# Scale for high availability
docker-compose up -d --scale llama-runner=3

# Update deployment
docker-compose pull
docker-compose up -d
```

### Kubernetes Deployment

#### ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: llama-runner-config
data:
  config.json: |
    {
      "environment": "production",
      "proxies": {
        "ollama": {
          "enabled": true,
          "port": 11434
        },
        "lmstudio": {
          "enabled": true,
          "port": 1234
        }
      }
    }
```

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llama-runner-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: llama-runner
  template:
    metadata:
      labels:
        app: llama-runner
    spec:
      containers:
      - name: llama-runner
        image: llama-runner:latest
        ports:
        - containerPort: 1234
        - containerPort: 11434
        env:
        - name: LLAMA_RUNNER_HEADLESS
          value: "true"
        - name: LLAMA_RUNNER_LOG_LEVEL
          value: "INFO"
        volumeMounts:
        - name: config-volume
          mountPath: /home/llama-runner/.llama-runner
        - name: models-volume
          mountPath: /models
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "16Gi"
            cpu: "8"
        livenessProbe:
          httpGet:
            path: /health
            port: 1234
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 1234
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: config-volume
        configMap:
          name: llama-runner-config
      - name: models-volume
        persistentVolumeClaim:
          claimName: models-pvc
```

#### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: llama-runner-service
spec:
  selector:
    app: llama-runner
  ports:
  - name: lmstudio
    port: 1234
    targetPort: 1234
  - name: ollama
    port: 11434
    targetPort: 11434
  type: LoadBalancer
```

### Cloud Platform Deployments

#### AWS Deployment

##### ECS with Fargate
```json
{
  "family": "llama-runner-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/llamaRunnerTaskRole",
  "containerDefinitions": [
    {
      "name": "llama-runner",
      "image": "your-account.dkr.ecr.region.amazonaws.com/llama-runner:latest",
      "portMappings": [
        {
          "containerPort": 1234,
          "protocol": "tcp"
        },
        {
          "containerPort": 11434,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "LLAMA_RUNNER_HEADLESS",
          "value": "true"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/llama-runner",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

##### AWS EKS
```bash
# Create EKS cluster
eksctl create cluster \
  --name llama-runner-cluster \
  --version 1.27 \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.xlarge \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10 \
  --managed

# Deploy
kubectl apply -f k8s-deployment.yaml
```

#### Google Cloud Platform

##### Cloud Run
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: llama-runner
  annotations:
    run.googleapis.com/ingress: internal
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "8Gi"
        run.googleapis.com/cpu: "4"
    spec:
      containerConcurrency: 10
      containers:
      - image: gcr.io/project-id/llama-runner:latest
        ports:
        - containerPort: 1234
        - containerPort: 11434
        env:
        - name: LLAMA_RUNNER_HEADLESS
          value: "true"
        resources:
          limits:
            cpu: 4
            memory: 8Gi
```

#### Azure Deployment

##### Container Instances
```yaml
apiVersion: 2021-03-01
location: eastus
name: llama-runner
properties:
  containers:
  - name: llama-runner
    properties:
      image: your-registry.azurecr.io/llama-runner:latest
      ports:
      - port: 1234
        protocol: TCP
      - port: 11434
        protocol: TCP
      environmentVariables:
      - name: LLAMA_RUNNER_HEADLESS
        value: "true"
      resources:
        requests:
          cpu: 4
          memoryInGb: 8
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
    - protocol: tcp
      port: 1234
    - protocol: tcp
      port: 11434
tags:
  project: llama-runner
```

## Load Balancing and Scaling

### Nginx Load Balancer

```nginx
upstream llama_runner_lmstudio {
    least_conn;
    server 127.0.0.1:1234 max_fails=3 fail_timeout=30s;
    server 10.0.1.10:1234 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:1234 max_fails=3 fail_timeout=30s;
}

upstream llama_runner_ollama {
    least_conn;
    server 127.0.0.1:11434 max_fails=3 fail_timeout=30s;
    server 10.0.1.10:11434 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:11434 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # LM Studio proxy
    location /lmstudio/ {
        proxy_pass http://llama_runner_lmstudio/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Ollama proxy
    location /ollama/ {
        proxy_pass http://llama_runner_ollama/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### HAProxy Configuration

```haproxy
global
    daemon
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend llama_runner_front
    bind *:80
    default_backend llama_runner_lmstudio

backend llama_runner_lmstudio
    balance roundrobin
    option httpchk GET /health
    server ll1 127.0.0.1:1234 check
    server ll2 10.0.1.10:1234 check
    server ll3 10.0.1.11:1234 check

backend llama_runner_ollama
    balance roundrobin
    option httpchk GET /health
    server ol1 127.0.0.1:11434 check
    server ol2 10.0.1.10:11434 check
    server ol3 10.0.1.11:11434 check
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Setup

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/llama-runner.crt;
    ssl_certificate_key /etc/ssl/private/llama-runner.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    location /lmstudio/ {
        proxy_pass http://llama_runner_lmstudio/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ollama/ {
        proxy_pass http://llama_runner_ollama/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring and Logging

### Prometheus Monitoring

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'llama-runner'
    static_configs:
      - targets: ['localhost:1234']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "LlamaRunner Pro",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(llama_runner_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "llama_runner_memory_usage_bytes"
          }
        ]
      }
    ]
  }
}
```

### ELK Stack Logging

```yaml
# docker-compose.elk.yml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
  
  logstash:
    image: logstash:8.8.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
  
  kibana:
    image: kibana:8.8.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

## Security Hardening

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow from 192.168.1.0/24 to any port 1234
sudo ufw allow from 192.168.1.0/24 to any port 11434
sudo ufw enable

# iptables
sudo iptables -A INPUT -p tcp --dport 1234 -s 192.168.1.0/24 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 11434 -s 192.168.1.0/24 -j ACCEPT
sudo iptables -A INPUT -j DROP
```

### Fail2ban Configuration

```ini
# /etc/fail2ban/jail.local
[llama-runner]
enabled = true
port = 1234,11434
protocol = tcp
filter = llama-runner
logpath = /var/log/llama-runner.log
maxretry = 3
bantime = 3600
findtime = 600
```

### System Security

```bash
# Disable unnecessary services
sudo systemctl disable bluetooth
sudo systemctl disable cups

# Set up automatic updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure audit logging
sudo apt install auditd
sudo auditctl -w /opt/llama-runner -p wa -k llama-runner
```

## Backup and Recovery

### Configuration Backup

```bash
#!/bin/bash
# backup-config.sh

BACKUP_DIR="/backup/llama-runner/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup configuration
cp -r ~/.llama-runner $BACKUP_DIR/

# Backup logs
cp /var/log/llama-runner.log $BACKUP_DIR/

# Create archive
tar -czf "${BACKUP_DIR}.tar.gz" -C /backup/llama-runner $(basename $BACKUP_DIR)

# Clean up directory
rm -rf $BACKUP_DIR

echo "Backup created: ${BACKUP_DIR}.tar.gz"
```

### Model Backup

```bash
#!/bin/bash
# backup-models.sh

BACKUP_DIR="/backup/llama-runner-models/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup model files
rsync -av /models/ $BACKUP_DIR/

# Compress
tar -czf "${BACKUP_DIR}.tar.gz" -C /backup/llama-runner-models $(basename $BACKUP_DIR)
rm -rf $BACKUP_DIR

echo "Model backup created: ${BACKUP_DIR}.tar.gz"
```

### Recovery Procedure

```bash
# 1. Stop service
sudo systemctl stop llama-runner

# 2. Restore configuration
tar -xzf /backup/llama-runner_YYYYMMDD_HHMMSS.tar.gz -C /

# 3. Restore models
tar -xzf /backup/llama-runner-models_YYYYMMDD_HHMMSS.tar.gz -C /

# 4. Fix permissions
sudo chown -R llama-runner:llama-runner /opt/llama-runner
sudo chown -R llama-runner:llama-runner ~/.llama-runner

# 5. Start service
sudo systemctl start llama-runner

# 6. Verify
sudo systemctl status llama-runner
curl -f http://localhost:1234/health
```

## Troubleshooting Deployment

### Common Issues

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :1234
sudo netstat -tulpn | grep :1234

# Kill process if necessary
sudo kill -9 <PID>
```

#### Permission Denied
```bash
# Fix ownership
sudo chown -R llama-runner:llama-runner /opt/llama-runner
sudo chmod -R 755 /opt/llama-runner

# Check SELinux context (RHEL/CentOS)
sudo restorecon -R /opt/llama-runner
```

#### Out of Memory
```bash
# Check memory usage
free -h
cat /proc/meminfo

# Reduce max models
echo '{"performance": {"concurrency": {"max_concurrent_models": 1}}}' >> ~/.llama-runner/config.json

# Add swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### Model Loading Failures
```bash
# Check model file
ls -la /models/
file /models/model.gguf

# Validate configuration
python -c "from llama_runner.config_validator import validate_config; print(validate_config(load_config()))"

# Check logs
sudo journalctl -u llama-runner -f
```

### Performance Tuning

#### CPU Optimization
```bash
# Set CPU governor to performance
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Pin processes to specific cores
taskset -c 0-3 python main.py --headless
```

#### Memory Optimization
```bash
# Clear cache
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# Configure swappiness
echo 10 | sudo tee /proc/sys/vm/swappiness
```

#### Storage Optimization
```bash
# Use noatime mount option
# In /etc/fstab:
/dev/sda1 / ext4 defaults,noatime 0 1

# Enable TRIM for SSDs
sudo fstrim -av
```

## Production Checklist

### Pre-Deployment
- [ ] Configuration validated
- [ ] Models tested locally
- [ ] Security audit completed
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] SSL certificates obtained
- [ ] Domain name configured
- [ ] Firewall rules set
- [ ] Load balancer configured

### Deployment
- [ ] Service user created
- [ ] Directory permissions set
- [ ] Systemd service configured
- [ ] Application deployed
- [ ] Configuration applied
- [ ] Services started
- [ ] Health checks passing

### Post-Deployment
- [ ] SSL/TLS working
- [ ] Load balancer health checks passing
- [ ] Monitoring metrics flowing
- [ ] Log aggregation working
- [ ] Performance baseline established
- [ ] Backup schedule tested
- [ ] Recovery procedure documented
- [ ] Team access configured

### Maintenance
- [ ] Regular security updates
- [ ] Log rotation configured
- [ ] Disk space monitoring
- [ ] Performance trending
- [ ] Capacity planning
- [ ] Documentation updated
- [ ] Disaster recovery tested
