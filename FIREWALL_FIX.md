# 🔥 Firewall Troubleshooting Guide

## Current Status
- ✅ UFW allows port 5000
- ✅ Docker container is running
- ✅ Port 5000 is bound to 0.0.0.0
- ✅ API works from localhost
- ❌ External connections timeout

## Issue: Cloud Firewall Blocking

Your hosting provider likely has a **separate cloud firewall** that's blocking port 5000.

### Steps to Fix:

#### 1. **Check Your Hosting Provider's Control Panel**

**If using Contabo/Hetzner/DigitalOcean/etc:**
- Log into your hosting provider's control panel
- Go to **Firewall** or **Security** settings
- Add a firewall rule to allow **TCP port 5000** from **all IPs (0.0.0.0/0)**

**Common Provider Panels:**
- **Contabo**: https://my.contabo.com → Security → Firewall
- **Hetzner**: https://console.hetzner.cloud → Firewalls
- **DigitalOcean**: https://cloud.digitalocean.com → Networking → Firewalls
- **Vultr**: https://my.vultr.com → Firewall

#### 2. **Disable Traefik in Dockploy**

In Dockploy UI (http://72.60.196.229:3000):

1. Go to your application: `fmgnregadata-crjpfi`
2. Click **Settings** → **Advanced**
3. Look for **Traefik Configuration** section
4. Set `traefik.enabled: false` or uncheck "Use Traefik"
5. In **Ports** section:
   - Container Port: 5000
   - Host Port: 5000
   - Select: **Direct Port Mapping** (not through Traefik)
6. **Save** and **Redeploy**

#### 3. **Alternative: Use Traefik with HTTP (not HTTPS)**

If you can't disable Traefik, configure it to route to your app:

In Dockploy, add these labels to your application:
```yaml
traefik.enable=true
traefik.http.routers.mgnrega.rule=Host(`72.60.196.229`)
traefik.http.routers.mgnrega.entrypoints=web
traefik.http.services.mgnrega.loadbalancer.server.port=5000
```

Then access via: `http://72.60.196.229/api/health` (port 80, through Traefik)

## Testing Commands

### From Server (should work):
```bash
curl http://localhost:5000/api/health
curl http://127.0.0.1:5000/api/health
```

### From Outside (currently failing):
```bash
curl http://72.60.196.229:5000/api/health
```

### Test with telnet:
```bash
telnet 72.60.196.229 5000
# If it connects, firewall is open
# If it times out, firewall is blocking
```

## Quick Fix: Use Docker Compose Directly

If Dockploy is giving you trouble, deploy manually:

```bash
cd /root/MHSite/backend
docker-compose down
docker-compose up -d
```

This will use the `docker-compose.yml` I created with Traefik disabled.

## Final Solution: Contact Your Hosting Provider

If none of the above works, contact your hosting provider support and ask:
> "Please open TCP port 5000 in the cloud firewall for server IP 72.60.196.229"

Most providers respond within a few hours and can open the port for you.
