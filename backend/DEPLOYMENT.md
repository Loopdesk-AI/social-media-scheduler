# AWS EC2 Deployment Guide

This guide covers deploying the Social Media Scheduler backend to AWS EC2.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Initial EC2 Setup](#initial-ec2-setup)
- [Option 1: Docker Deployment](#option-1-docker-deployment-recommended)
- [Option 2: PM2 Deployment](#option-2-pm2-deployment)
- [Nginx Reverse Proxy](#nginx-reverse-proxy)
- [SSL/TLS with Let's Encrypt](#ssltls-with-lets-encrypt)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Redis Configuration](#redis-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### AWS Resources Needed

| Resource | Purpose | Recommendation |
|----------|---------|----------------|
| EC2 Instance | Application server | t3.small or larger |
| RDS PostgreSQL / Neon | Database | Cloud-hosted PostgreSQL |
| ElastiCache Redis | Job queue & caching | Redis 7+ |
| Security Groups | Firewall rules | See [Security section](#security-best-practices) |
| Elastic IP | Static IP address | Optional but recommended |
| Route 53 | DNS management | Optional |

### EC2 Instance Requirements

- **OS**: Amazon Linux 2023 or Ubuntu 22.04 LTS
- **vCPUs**: 2+ recommended
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB+ EBS volume
- **Ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS)

---

## Deployment Options

| Method | Best For | Complexity |
|--------|----------|------------|
| Docker | Most production deployments | Low |
| PM2 | Direct Node.js deployment | Medium |
| Systemd | Traditional service management | Medium |

---

## Initial EC2 Setup

### 1. Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose Amazon Linux 2023 AMI
3. Select instance type (t3.small recommended)
4. Configure security group:
   - SSH (22) - Your IP only
   - HTTP (80) - Anywhere
   - HTTPS (443) - Anywhere
5. Create or select a key pair
6. Launch instance

### 2. Connect to Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### 3. Run Initial Setup Script

```bash
# Clone your repository first
git clone https://github.com/your-username/social-media-scheduler.git
cd social-media-scheduler/backend

# Make the deploy script executable
chmod +x deploy/deploy.sh

# Run initial setup
./deploy/deploy.sh --setup
```

Or manually install dependencies:

```bash
# Update system
sudo yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PM2 globally
sudo npm install -g pm2

# Install Docker (optional)
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo yum install -y nginx
sudo systemctl enable nginx
```

---

## Option 1: Docker Deployment (Recommended)

### 1. Clone Repository

```bash
cd /home/ec2-user
git clone https://github.com/your-username/social-media-scheduler.git
cd social-media-scheduler/backend
```

### 2. Configure Environment

```bash
# Copy the production environment template
cp .env.production.example .env

# Edit with your production values
nano .env
```

### 3. Build and Run

```bash
# Build and start containers
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 4. Useful Docker Commands

```bash
# Stop containers
docker compose down

# Restart containers
docker compose restart

# View logs
docker compose logs -f --tail=100

# Rebuild after code changes
docker compose up -d --build

# Shell into container
docker compose exec backend sh

# Check container health
docker compose ps
```

---

## Option 2: PM2 Deployment

### 1. Clone Repository

```bash
cd /home/ec2-user
git clone https://github.com/your-username/social-media-scheduler.git
cd social-media-scheduler/backend
```

### 2. Install Dependencies and Build

```bash
# Install all dependencies
npm ci

# Build TypeScript
npm run build

# Remove dev dependencies
npm prune --production
```

### 3. Configure Environment

```bash
cp .env.production.example .env
nano .env
```

### 4. Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save process list for auto-restart
pm2 save

# Setup startup script
pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

### 5. Useful PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs social-media-backend

# Restart application
pm2 restart social-media-backend

# Reload (zero-downtime)
pm2 reload social-media-backend

# Monitor resources
pm2 monit

# Stop application
pm2 stop social-media-backend

# Delete from PM2
pm2 delete social-media-backend
```

---

## Nginx Reverse Proxy

### 1. Install Nginx

```bash
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Configure Nginx

```bash
# Copy the provided config
sudo cp deploy/nginx.conf /etc/nginx/conf.d/social-media-backend.conf

# Edit the config to update your domain
sudo nano /etc/nginx/conf.d/social-media-backend.conf

# Replace 'your-backend-domain.com' with your actual domain
```

### 3. Test and Reload

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL/TLS with Let's Encrypt

### 1. Install Certbot

```bash
# For Amazon Linux 2023
sudo yum install -y certbot python3-certbot-nginx

# For Amazon Linux 2
sudo amazon-linux-extras install epel
sudo yum install -y certbot python-certbot-nginx
```

### 2. Obtain Certificate

```bash
# Make sure your domain points to your EC2 IP first
sudo certbot --nginx -d your-backend-domain.com
```

### 3. Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

---

## Environment Variables

### Required Variables

```bash
# Core
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis
REDIS_HOST=your-elasticache-endpoint.cache.amazonaws.com
REDIS_PORT=6379
REDIS_TLS=true

# Security (generate a new key!)
ENCRYPTION_KEY=your-64-character-hex-key

# Cloudflare R2 (required)
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY=your-access-key
CLOUDFLARE_R2_SECRET_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET=your-bucket
CLOUDFLARE_R2_PUBLIC_URL=https://your-r2-domain.com
```

### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

### Using AWS RDS

1. Create RDS PostgreSQL instance in the same VPC
2. Configure security group to allow access from EC2
3. Note the endpoint and credentials
4. Update `DATABASE_URL` in `.env`

### Using Neon (Cloud PostgreSQL)

1. Create account at neon.tech
2. Create a new project and database
3. Copy the connection string to `DATABASE_URL`

### Run Migrations

```bash
# If using Docker
docker compose exec backend npm run db:push

# If using PM2
npm run db:push
```

---

## Redis Configuration

### Using AWS ElastiCache

1. Create ElastiCache Redis cluster in the same VPC
2. Configure security group to allow access from EC2
3. Update Redis configuration in `.env`:

```bash
REDIS_HOST=your-cluster.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_TLS=true
REDIS_CLUSTER_MODE=false  # or true for cluster mode
```

### Testing Redis Connection

```bash
# If using Docker
docker compose exec backend node -e "
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined
});
redis.ping().then(console.log).catch(console.error).finally(() => redis.quit());
"
```

---

## Monitoring & Logging

### Health Checks

The application exposes these health endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/health` | Full health check (DB, Redis, etc.) |
| `/health/live` | Liveness probe |
| `/health/ready` | Readiness probe |

### CloudWatch Integration

```bash
# Install CloudWatch agent
sudo yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### View Logs

```bash
# Docker logs
docker compose logs -f --tail=100

# PM2 logs
pm2 logs social-media-backend --lines 100

# System logs
sudo journalctl -u nginx -f
```

### BullMQ Dashboard

Enable the queue dashboard in production:

```bash
# In .env
ENABLE_BULL_BOARD=true
```

Access at: `https://your-domain.com/admin/queues`

**Note**: Restrict access using Nginx authentication or IP whitelist in production.

---

## Security Best Practices

### 1. EC2 Security Group Rules

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| SSH | 22 | Your IP only | Administration |
| HTTP | 80 | 0.0.0.0/0 | Redirect to HTTPS |
| HTTPS | 443 | 0.0.0.0/0 | API traffic |

### 2. Environment Security

- Never commit `.env` to version control
- Use AWS Secrets Manager or Parameter Store for sensitive values
- Rotate encryption keys periodically
- Use IAM roles instead of access keys when possible

### 3. Application Security

- Keep dependencies updated
- Enable rate limiting in Nginx
- Use security headers (configured in app and Nginx)
- Restrict admin endpoints

### 4. Regular Updates

```bash
# Update system packages
sudo yum update -y

# Update Node.js dependencies (test in staging first)
npm audit
npm update
```

---

## Troubleshooting

### Common Issues

#### Container won't start

```bash
# Check logs
docker compose logs backend

# Check if port is in use
sudo lsof -i :3001

# Rebuild container
docker compose down
docker compose build --no-cache
docker compose up -d
```

#### Cannot connect to database

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check security group allows connection
# Verify DATABASE_URL format
```

#### Cannot connect to Redis

```bash
# Test Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT --tls ping

# For ElastiCache, ensure EC2 and Redis are in same VPC
# Check security group allows port 6379
```

#### Health check failing

```bash
# Test locally
curl http://localhost:3001/health

# Check application logs
docker compose logs backend --tail=50

# Verify environment variables are set
docker compose exec backend env | grep -E "(DATABASE|REDIS)"
```

#### Nginx 502 Bad Gateway

```bash
# Check if backend is running
curl http://localhost:3001/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify upstream configuration in Nginx
```

### Useful Debug Commands

```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check running processes
ps aux | grep node

# Check open ports
sudo netstat -tlnp

# Check Docker containers
docker ps -a

# Check PM2 processes
pm2 list
```

---

## Deployment Checklist

Before going live, verify:

- [ ] Environment variables configured correctly
- [ ] Database migrations run successfully
- [ ] Redis connection working
- [ ] Health check endpoint responding
- [ ] SSL certificate installed and valid
- [ ] Nginx configured and running
- [ ] Security groups properly configured
- [ ] Logs being captured
- [ ] Auto-restart configured (PM2/Docker restart policy)
- [ ] Backup strategy in place for database
- [ ] Monitoring/alerting set up

---

## Quick Reference

### Start Services

```bash
# Docker
docker compose up -d

# PM2
pm2 start ecosystem.config.js --env production
```

### Stop Services

```bash
# Docker
docker compose down

# PM2
pm2 stop all
```

### View Logs

```bash
# Docker
docker compose logs -f

# PM2
pm2 logs
```

### Restart Services

```bash
# Docker
docker compose restart

# PM2
pm2 reload all
```

### Update Application

```bash
# Using deploy script
./deploy/deploy.sh --docker  # or --pm2

# Manual Docker
git pull
docker compose up -d --build

# Manual PM2
git pull
npm ci
npm run build
pm2 reload all
```

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs
3. Open an issue on GitHub