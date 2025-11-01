# 🚀 Docker Deployment Guide for Dockploy

## 📋 Prerequisites
- Docker installed on your server
- Your code repository accessible (GitHub, GitLab, etc.)
- Access to Dockploy dashboard

## 🐳 Dockploy Deployment Steps

### 1. **Create New Application in Dockploy**
   - Go to your Dockploy dashboard
   - Click "Create New Application"
   - Choose "Docker" as deployment type

### 2. **Configure Repository**
   - Connect your Git repository
   - Select the branch (e.g., `main` or `master`)
   - Set build context to `/backend` (if in monorepo) or `/` if backend is root

### 3. **Configure Environment Variables**
   Add these environment variables in Dockploy:
   ```
   PORT=5000
   NODE_ENV=production
   
   # MGNREGA API
   MGNREGA_API_KEY=579b464db66ec23bdd0000014c2e612bf9dc4913661230183cd84603
   MGNREGA_BASE_URL=https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722
   
   # PostgreSQL
   DATABASE_URL=postgresql://postgres:33weerewreS@72.60.196.209:5432/PostGtdb
   DB_HOST=72.60.196.209
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=33weerewreS
   DB_NAME=PostGtdb
   
   # Redis (Internal Dockploy network)
   REDIS_HOST=dbgt-redisgt-vngqpx
   REDIS_PORT=6379
   REDIS_PASSWORD=AhjsgEE33##r
   REDIS_URL=redis://default:AhjsgEE33##r@dbgt-redisgt-vngqpx:6379
   
   # Cron
   CRON_SCHEDULE=0 2 * * *
   ```

### 4. **Configure Port Mapping**
   - **Container Port**: 5000
   - **Host Port**: 5000
   - Enable "Publish Port" or "Expose Port"
   - Make sure to select "Direct IP Access" or disable domain requirement

### 5. **Deploy**
   - Click "Deploy" button
   - Dockploy will:
     - Clone your repository
     - Build the Docker image using your Dockerfile
     - Start the container
     - Map port 5000 to your server

### 6. **Verify Deployment**
   Once deployed, test with:
   ```bash
   curl http://72.60.196.229:5000/api/health
   ```

## 🔧 Manual Docker Commands (Alternative)

If you want to deploy manually without Dockploy:

### Build the image:
```bash
cd /root/MHSite/backend
docker build -t mgnrega-backend .
```

### Run the container:
```bash
docker run -d \
  --name mgnrega-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  mgnrega-backend
```

### Check logs:
```bash
docker logs -f mgnrega-backend
```

### Stop container:
```bash
docker stop mgnrega-backend
docker rm mgnrega-backend
```

## 🌐 Access Your API

Once deployed, access your API at:
- **Base URL**: `http://72.60.196.229:5000`
- **Health Check**: `http://72.60.196.229:5000/api/health`
- **States**: `http://72.60.196.229:5000/api/states`
- **Districts**: `http://72.60.196.229:5000/api/districts/Maharashtra`

## 🔥 Firewall Configuration

Make sure port 5000 is open on your server:
```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 5000/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
```

## 🐛 Troubleshooting

### Check if container is running:
```bash
docker ps | grep mgnrega-backend
```

### View logs:
```bash
docker logs mgnrega-backend
```

### Inspect container:
```bash
docker inspect mgnrega-backend
```

### Test from inside server:
```bash
curl http://localhost:5000/api/health
```

### Test from outside:
```bash
curl http://72.60.196.229:5000/api/health
```

## 📝 Notes

- The Dockerfile uses Node.js 18 Alpine (lightweight)
- Production dependencies only (no devDependencies)
- Health check runs every 30 seconds
- Automatic restart on failure
- CORS enabled for all origins (adjust if needed)
- Port 5000 exposed and mapped to host

## 🔄 Database Initialization

If you need to initialize the database, run:
```bash
docker exec -it mgnrega-backend npm run init-db
```

## 🎯 Next Steps

1. Deploy using Dockploy with the Dockerfile
2. Set environment variables in Dockploy UI
3. Enable port 5000 access without domain
4. Test API endpoints
5. Set up monitoring/logging (optional)
