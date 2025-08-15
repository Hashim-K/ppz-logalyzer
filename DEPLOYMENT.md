# PPZ-Logalyzer Deployment Guide
## Ubuntu 24.04.2 LTS VPS with Plesk Docker Proxy Rules

This guide covers deploying PPZ-Logalyzer on your Ubuntu 24.04.2 LTS VPS using Plesk's Docker proxy rules instead of nginx.

## Prerequisites

- Ubuntu 24.04.2 LTS VPS
- Plesk Panel with Docker support
- Domain name configured in Plesk
- Docker and Docker Compose installed

## Deployment Steps

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker if not already installed (Docker Compose V2 is included)
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to docker group (replace 'your-user' with actual username)
sudo usermod -aG docker your-user
```

### 2. Project Setup

```bash
# Clone or upload the project to your VPS
cd /var/www/vhosts/yourdomain.com/
git clone https://github.com/Hashim-K/ppz-logalyzer.git
cd ppz-logalyzer

# Copy and configure environment variables
cp .env.production .env
```

### 3. Environment Configuration

Edit `.env` file with your production values:

```bash
nano .env
```

**Critical settings to update:**
```env
# Strong database password
DB_PASSWORD=your_very_secure_password_here

# JWT secret (minimum 32 characters)
JWT_SECRET=your_jwt_secret_minimum_32_characters_long

# API URLs for your domain
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Grafana admin password
GRAFANA_PASSWORD=your_grafana_password
```

### 4. Build and Start Services

```bash
# Build and start all services
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f
```

### 5. Plesk Docker Proxy Configuration

In Plesk Panel:

#### 5.1 Main Website (Frontend)
1. Go to **Hosting & DNS** → **Apache & nginx Settings**
2. Enable **Additional nginx directives**
3. Add proxy rule for frontend:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

#### 5.2 API Subdomain (Optional)
Create subdomain `api.yourdomain.com` and add:

```nginx
location / {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

#### 5.3 Monitoring Subdomain (Optional)
Create subdomain `monitor.yourdomain.com` for Grafana:

```nginx
location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 6. SSL Certificate Setup

1. In Plesk, go to **SSL/TLS Certificates**
2. Enable **Let's Encrypt** for:
   - Main domain (yourdomain.com)
   - API subdomain (api.yourdomain.com) if used
   - Monitor subdomain (monitor.yourdomain.com) if used
3. Enable **Redirect from HTTP to HTTPS**

### 7. Firewall Configuration

```bash
# Allow required ports through UFW
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

**Note**: Docker containers are accessible via localhost only, Plesk proxy handles external access.

### 8. Health Checks and Monitoring

```bash
# Check container health
docker compose ps

# Check application health endpoints
curl http://localhost:8000/health
curl http://localhost:3000/

# View service logs
docker compose logs backend
docker compose logs frontend
docker compose logs database
```

### 9. Database Initialization

First-time setup:

```bash
# Access the database container
docker compose exec database psql -U ppz_user -d ppz_logalyzer

# The database will auto-initialize with the schemas
# Check tables are created:
\dt
```

## Production Maintenance

### Backup Strategy

```bash
# Database backup
docker compose exec database pg_dump -U ppz_user ppz_logalyzer > backup_$(date +%Y%m%d).sql

# Volume backup
docker run --rm -v ppz-logalyzer_uploads:/data -v $(pwd):/backup ubuntu tar czf /backup/uploads_backup_$(date +%Y%m%d).tar.gz -C /data .
```

### Updates and Maintenance

```bash
# Update application
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d

# View logs after update
docker compose logs -f
```

### Performance Monitoring

Access monitoring dashboards:
- **Grafana**: https://monitor.yourdomain.com (if configured)
- **Prometheus metrics**: http://localhost:9091 (internal only)

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, 5432, 6379 are not used by other services
2. **Memory issues**: Adjust resource limits in docker-compose.yml based on VPS specs
3. **File permissions**: Check that the `ppz-user` has proper permissions for data directories

### Useful Commands

```bash
# Restart specific service
docker compose restart backend

# View container resource usage
docker stats

# Access container shell
docker compose exec backend /bin/bash
docker compose exec database /bin/bash

# Remove all data and restart fresh
docker compose down -v
docker compose up -d
```

## Resource Requirements

**Minimum VPS specifications:**
- 2 CPU cores
- 4GB RAM  
- 20GB storage
- Ubuntu 24.04.2 LTS

**Recommended for production:**
- 4 CPU cores
- 8GB RAM
- 50GB+ storage
- Regular backups configured

## Security Considerations

1. **Strong passwords**: Use complex passwords for all services
2. **Regular updates**: Keep Ubuntu and Docker updated
3. **Backup encryption**: Encrypt database backups
4. **Access logs**: Monitor Plesk access logs
5. **SSL certificates**: Ensure all traffic uses HTTPS
6. **Database access**: Database is only accessible from localhost

---

This deployment setup is optimized for Ubuntu 24.04.2 LTS and leverages Plesk's proxy capabilities for a clean, maintainable production environment.
