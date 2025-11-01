# 🔧 FIX: Database Connection Error in Docker

## ❌ Problem
Your Docker container can't connect to PostgreSQL because it's using the **external IP** (`72.60.196.209`) instead of the **internal Docker network hostname**.

## ✅ Solution

### Update Environment Variables in Dockploy

Go to your Dockploy dashboard and update these environment variables:

#### ❌ OLD (External IP - doesn't work in Docker):
```env
DATABASE_URL=postgresql://postgres:33weerewreS@72.60.196.209:5432/PostGtdb
DB_HOST=72.60.196.209
```

#### ✅ NEW (Internal Docker hostname - works!):
```env
DATABASE_URL=postgresql://postgres:33weerewreS@dbgt-postgt-2sc98v:5432/PostGtdb
DB_HOST=dbgt-postgt-2sc98v
```

### Complete Environment Variables for Dockploy

Copy and paste these into your Dockploy application settings:

```env
# Server Config
PORT=5000
NODE_ENV=production

# MGNREGA API
MGNREGA_API_KEY=579b464db66ec23bdd0000014c2e612bf9dc4913661230183cd84603
MGNREGA_BASE_URL=https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722

# PostgreSQL - USE INTERNAL DOCKER HOSTNAME
DATABASE_URL=postgresql://postgres:33weerewreS@dbgt-postgt-2sc98v:5432/PostGtdb
DB_HOST=dbgt-postgt-2sc98v
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=33weerewreS
DB_NAME=PostGtdb

# Redis - USE INTERNAL DOCKER HOSTNAME
REDIS_HOST=dbgt-redisgt-vngqpx
REDIS_PORT=6379
REDIS_PASSWORD=AhjsgEE33##r
REDIS_URL=redis://default:AhjsgEE33##r@dbgt-redisgt-vngqpx:6379

# Cron
CRON_SCHEDULE=0 2 * * *
```

---

## 📋 Steps to Fix:

1. **Go to Dockploy Dashboard**: `http://72.60.196.209:3000`
2. **Find your application**: `fmgnregadata-crjpfi`
3. **Go to Settings** → **Environment Variables**
4. **Update these two variables**:
   - `DATABASE_URL` → `postgresql://postgres:33weerewreS@dbgt-postgt-2sc98v:5432/PostGtdb`
   - `DB_HOST` → `dbgt-postgt-2sc98v`
5. **Save** and **Redeploy**

---

## 🧪 Verify the Fix

After redeploying, check the logs:

```bash
# Get new container ID
docker ps | grep mgnrega

# Check logs
docker logs <new-container-id>

# Should see:
# ✅ PostgreSQL connected successfully
```

Test the API:
```bash
curl http://72.60.196.209:5000/api/states
```

---

## 🎯 Why This Happens

**Docker Networking Rules:**
- ❌ **External IPs** (`72.60.196.209`) - Blocked by Docker network isolation
- ✅ **Service Names** (`dbgt-postgt-2sc98v`) - Work within Docker network
- ✅ **Internal IPs** (`10.0.1.26`) - Work but service names are better

**Key Point**: When containers are in the same Docker network (`dokploy-network`), they **must use service names** or internal IPs, NOT external IPs.

---

## 📝 For Your .env File (Local Development)

Keep your local `.env` file as is (with external IP) for local development:

```env
# Local development - use external IP
DATABASE_URL=postgresql://postgres:33weerewreS@72.60.196.209:5432/PostGtdb
DB_HOST=72.60.196.209
```

This is correct for running locally because you're not inside Docker.

---

## 🚀 Alternative: Use docker-compose.yml

If you want to use docker-compose instead of Dockploy UI, update the docker-compose.yml:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:33weerewreS@dbgt-postgt-2sc98v:5432/PostGtdb
      - DB_HOST=dbgt-postgt-2sc98v
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=33weerewreS
      - DB_NAME=PostGtdb
      - REDIS_HOST=dbgt-redisgt-vngqpx
      - REDIS_PORT=6379
      - REDIS_PASSWORD=AhjsgEE33##r
      - REDIS_URL=redis://default:AhjsgEE33##r@dbgt-redisgt-vngqpx:6379
      - MGNREGA_API_KEY=579b464db66ec23bdd0000014c2e612bf9dc4913661230183cd84603
      - MGNREGA_BASE_URL=https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722
      - CRON_SCHEDULE=0 2 * * *
    networks:
      - dokploy-network
    labels:
      - "traefik.enable=false"

networks:
  dokploy-network:
    external: true
```

Then deploy:
```bash
docker-compose down
docker-compose up -d
```

---

## ✅ Summary

**The Fix**: Change `72.60.196.209` → `dbgt-postgt-2sc98v` in Dockploy environment variables

This is the most common Docker networking issue! 🎯
