#!/bin/bash

# =============================================================================
# AWS EC2 Deployment Script for Social Media Scheduler Backend
# =============================================================================
# This script automates the deployment process on an EC2 instance
#
# Prerequisites:
#   - Node.js 20+ installed
#   - PM2 installed globally (npm install -g pm2)
#   - Nginx installed (for reverse proxy)
#   - Git installed
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh [--docker|--pm2]
#
# Options:
#   --docker  Deploy using Docker (default)
#   --pm2     Deploy using PM2 process manager
#   --setup   Initial server setup
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="social-media-backend"
APP_DIR="/home/ec2-user/app/backend"
DEPLOY_USER="ec2-user"
LOG_DIR="/home/ec2-user/app/logs"

# Functions
print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 20+"
        exit 1
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm installed: $NPM_VERSION"
    else
        print_error "npm not found"
        exit 1
    fi

    # Check for .env file
    if [ -f "$APP_DIR/.env" ]; then
        print_success ".env file exists"
    else
        print_warning ".env file not found. Copy from .env.production.example"
        print_warning "Run: cp $APP_DIR/.env.production.example $APP_DIR/.env"
    fi
}

check_docker_prerequisites() {
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker installed: $DOCKER_VERSION"
    else
        print_error "Docker not found. Please install Docker"
        exit 1
    fi

    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose installed"
    else
        print_error "Docker Compose not found"
        exit 1
    fi
}

check_pm2_prerequisites() {
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 -v)
        print_success "PM2 installed: $PM2_VERSION"
    else
        print_warning "PM2 not found. Installing..."
        npm install -g pm2
        print_success "PM2 installed"
    fi
}

setup_directories() {
    print_header "Setting Up Directories"

    mkdir -p "$APP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$APP_DIR/uploads"

    print_success "Directories created"
}

pull_latest_code() {
    print_header "Pulling Latest Code"

    cd "$APP_DIR"

    if [ -d ".git" ]; then
        git fetch origin
        git reset --hard origin/main
        print_success "Code updated from repository"
    else
        print_warning "Not a git repository. Skipping pull."
    fi
}

install_dependencies() {
    print_header "Installing Dependencies"

    cd "$APP_DIR"
    npm ci --only=production

    print_success "Dependencies installed"
}

build_application() {
    print_header "Building Application"

    cd "$APP_DIR"

    # Install dev dependencies temporarily for build
    npm ci
    npm run build

    # Clean up dev dependencies
    npm prune --production

    print_success "Application built successfully"
}

run_migrations() {
    print_header "Running Database Migrations"

    cd "$APP_DIR"

    if [ -f "package.json" ]; then
        # Check if db:push script exists
        if npm run 2>/dev/null | grep -q "db:push"; then
            npm run db:push
            print_success "Database schema pushed"
        else
            print_warning "No db:push script found. Skipping migrations."
        fi
    fi
}

deploy_with_docker() {
    print_header "Deploying with Docker"

    cd "$APP_DIR"

    # Stop existing containers
    docker compose down --remove-orphans 2>/dev/null || true

    # Build and start containers
    docker compose build --no-cache
    docker compose up -d

    # Wait for container to be healthy
    echo "Waiting for container to be healthy..."
    sleep 10

    # Check container status
    if docker compose ps | grep -q "healthy\|running"; then
        print_success "Docker containers are running"
    else
        print_error "Container may not be healthy. Check logs with: docker compose logs"
    fi

    # Show container status
    docker compose ps
}

deploy_with_pm2() {
    print_header "Deploying with PM2"

    cd "$APP_DIR"

    # Stop existing PM2 processes
    pm2 delete "$APP_NAME" 2>/dev/null || true

    # Start application with PM2
    pm2 start ecosystem.config.js --env production

    # Save PM2 process list for auto-restart on reboot
    pm2 save

    # Setup PM2 to run on system startup
    pm2 startup systemd -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER" 2>/dev/null || true

    print_success "Application started with PM2"

    # Show PM2 status
    pm2 status
}

health_check() {
    print_header "Running Health Check"

    local PORT=${PORT:-3001}
    local MAX_RETRIES=30
    local RETRY_COUNT=0

    echo "Checking health endpoint at http://localhost:$PORT/health/live"

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/health/live" | grep -q "200"; then
            print_success "Health check passed!"
            return 0
        fi

        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Waiting for service to be ready... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 2
    done

    print_error "Health check failed after $MAX_RETRIES attempts"
    return 1
}

setup_nginx() {
    print_header "Setting Up Nginx"

    # Check if nginx is installed
    if ! command -v nginx &> /dev/null; then
        print_warning "Nginx not installed. Installing..."
        sudo amazon-linux-extras install nginx1 -y 2>/dev/null || sudo yum install nginx -y
    fi

    # Copy nginx config
    if [ -f "$APP_DIR/deploy/nginx.conf" ]; then
        sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/conf.d/social-media-backend.conf

        # Test nginx config
        if sudo nginx -t; then
            sudo systemctl restart nginx
            sudo systemctl enable nginx
            print_success "Nginx configured and restarted"
        else
            print_error "Nginx configuration test failed"
        fi
    else
        print_warning "Nginx config not found at $APP_DIR/deploy/nginx.conf"
    fi
}

setup_firewall() {
    print_header "Configuring Firewall"

    # Open HTTP/HTTPS ports (if firewalld is available)
    if command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        print_success "Firewall configured"
    else
        print_warning "firewalld not found. Make sure AWS Security Group allows ports 80/443"
    fi
}

initial_setup() {
    print_header "Initial Server Setup"

    # Update system
    echo "Updating system packages..."
    sudo yum update -y

    # Install essential packages
    echo "Installing essential packages..."
    sudo yum install -y git curl wget

    # Install Node.js 20 using NVM
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20
        nvm use 20
        nvm alias default 20
    fi

    # Install PM2
    echo "Installing PM2..."
    npm install -g pm2

    # Install Docker (optional)
    echo "Installing Docker..."
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker "$DEPLOY_USER"

    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # Install Nginx
    echo "Installing Nginx..."
    sudo amazon-linux-extras install nginx1 -y 2>/dev/null || sudo yum install nginx -y
    sudo systemctl enable nginx

    setup_directories
    setup_firewall

    print_success "Initial setup complete!"
    print_warning "Please log out and back in for Docker group changes to take effect"
    print_warning "Don't forget to create your .env file from .env.production.example"
}

show_logs() {
    print_header "Application Logs"

    if [ "$1" == "docker" ]; then
        docker compose logs -f --tail=100
    else
        pm2 logs "$APP_NAME" --lines 100
    fi
}

# Main script
main() {
    DEPLOY_MODE="docker"  # Default to docker

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --docker)
                DEPLOY_MODE="docker"
                shift
                ;;
            --pm2)
                DEPLOY_MODE="pm2"
                shift
                ;;
            --setup)
                initial_setup
                exit 0
                ;;
            --logs)
                show_logs "$DEPLOY_MODE"
                exit 0
                ;;
            --health)
                health_check
                exit 0
                ;;
            --nginx)
                setup_nginx
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                echo "Usage: $0 [--docker|--pm2|--setup|--logs|--health|--nginx]"
                exit 1
                ;;
        esac
    done

    print_header "Starting Deployment - Mode: $DEPLOY_MODE"

    # Run deployment steps
    check_prerequisites

    if [ "$DEPLOY_MODE" == "docker" ]; then
        check_docker_prerequisites
        setup_directories
        pull_latest_code
        deploy_with_docker
    else
        check_pm2_prerequisites
        setup_directories
        pull_latest_code
        install_dependencies
        build_application
        run_migrations
        deploy_with_pm2
    fi

    # Run health check
    health_check

    print_header "Deployment Complete!"
    echo -e "Application is running at: ${GREEN}http://localhost:${PORT:-3001}${NC}"
    echo -e "Health check: ${GREEN}http://localhost:${PORT:-3001}/health${NC}"

    if [ "$DEPLOY_MODE" == "docker" ]; then
        echo -e "\nUseful commands:"
        echo "  docker compose logs -f    # View logs"
        echo "  docker compose ps         # Check status"
        echo "  docker compose restart    # Restart service"
    else
        echo -e "\nUseful commands:"
        echo "  pm2 logs $APP_NAME        # View logs"
        echo "  pm2 status                # Check status"
        echo "  pm2 restart $APP_NAME     # Restart service"
        echo "  pm2 monit                 # Monitor resources"
    fi
}

# Run main function
main "$@"
