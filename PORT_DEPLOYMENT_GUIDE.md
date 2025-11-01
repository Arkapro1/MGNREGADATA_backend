# 🚀 Port Deployment & Troubleshooting Cheat Sheet

## Essential Commands for Port Checking & Deployment

### 1️⃣ **Find Your Server's Public IP**

```bash
# Method 1: Check network interface
ip addr show | grep 'inet ' | grep -v '127.0.0.1'

# Method 2: Get public IP from external service
curl -4 ifconfig.me
# or
curl -4 icanhazip.com

# Method 3: Check specific interface (eth0)
ip addr show eth0 | grep 'inet '
```

---

### 2️⃣ **Check if Docker Container is Running**

```bash
# List all running containers
docker ps

# Check specific container
docker ps | grep <container-name>

# Get container details
docker inspect <container-id-or-name>

# Check container logs
docker logs <container-id-or-name>
docker logs -f <container-id-or-name>  # Follow logs in real-time
docker logs --tail 50 <container-id-or-name>  # Last 50 lines
```

---

### 3️⃣ **Check Port Mapping**

```bash
# Check which ports a container is exposing
docker port <container-id-or-name>

# Check what's listening on a specific port
netstat -tulpn | grep :<port-number>
# or
ss -tulpn | grep :<port-number>

# Example for port 5000
netstat -tulpn | grep :5000

# Check all listening ports
netstat -tulpn | grep LISTEN
```

---

### 4️⃣ **Test Port Locally (on server)**

```bash
# Test with curl
curl http://localhost:<port>/api/health
curl http://127.0.0.1:<port>/api/health

# Test with your server's IP
curl http://<your-server-ip>:<port>/api/health

# Test if port accepts connections
timeout 5 bash -c "cat < /dev/null > /dev/tcp/localhost/<port>" && echo "Port is open" || echo "Port is closed"

# Test with telnet
telnet localhost <port>
```

---

### 5️⃣ **Check Firewall Settings**

```bash
# UFW (Ubuntu/Debian)
sudo ufw status
sudo ufw allow <port>/tcp
sudo ufw reload

# Check if UFW is active
sudo ufw status verbose

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=<port>/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -L -n -v
sudo iptables -L INPUT -n -v | grep <port>
sudo iptables -L DOCKER -n -v | grep <port>
```

---

### 6️⃣ **Test Port from Outside (Remote)**

```bash
# From your local machine (Linux/Mac)
curl http://<server-ip>:<port>/api/health

# Test connection with telnet
telnet <server-ip> <port>

# Test with netcat
nc -zv <server-ip> <port>

# Windows PowerShell
curl http://<server-ip>:<port>/api/health
Test-NetConnection -ComputerName <server-ip> -Port <port>
```

---

### 7️⃣ **Docker Network Inspection**

```bash
# List Docker networks
docker network ls

# Inspect a network
docker network inspect <network-name>

# Check container network mode
docker inspect <container-id> --format '{{.HostConfig.NetworkMode}}'

# Check container IP address
docker inspect <container-id> --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

# Check port bindings
docker inspect <container-id> --format '{{json .NetworkSettings.Ports}}' | python3 -m json.tool
```

---

### 8️⃣ **Check Traefik Configuration (Dockploy)**

```bash
# Check if Traefik is enabled on container
docker inspect <container-id> --format '{{range $key, $value := .Config.Labels}}{{$key}}={{$value}}{{println}}{{end}}' | grep traefik

# Check Traefik container logs
docker logs dokploy-traefik

# List all containers with Traefik labels
docker ps --format '{{.Names}}' | xargs -I {} docker inspect {} --format '{{.Name}}: {{index .Config.Labels "traefik.enable"}}'
```

---

### 9️⃣ **Test Complete Port Flow**

```bash
#!/bin/bash
# Save as test-port.sh and run: bash test-port.sh <port>

PORT=${1:-5000}
SERVER_IP=$(curl -s ifconfig.me)

echo "==================================="
echo "🔍 Testing Port: $PORT"
echo "🌐 Server IP: $SERVER_IP"
echo "==================================="

echo ""
echo "1️⃣ Checking if port is listening..."
netstat -tulpn | grep ":$PORT " && echo "✅ Port is listening" || echo "❌ Port not listening"

echo ""
echo "2️⃣ Testing localhost..."
curl -s http://localhost:$PORT/api/health && echo "✅ Localhost OK" || echo "❌ Localhost failed"

echo ""
echo "3️⃣ Testing 127.0.0.1..."
curl -s http://127.0.0.1:$PORT/api/health && echo "✅ 127.0.0.1 OK" || echo "❌ 127.0.0.1 failed"

echo ""
echo "4️⃣ Testing server IP..."
timeout 5 curl -s http://$SERVER_IP:$PORT/api/health && echo "✅ Server IP OK" || echo "❌ Server IP failed (Cloud firewall may be blocking)"

echo ""
echo "5️⃣ Checking UFW..."
sudo ufw status | grep "$PORT" && echo "✅ UFW allows port" || echo "⚠️  UFW may be blocking"

echo ""
echo "6️⃣ Checking Docker containers on this port..."
docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep "$PORT"

echo ""
echo "==================================="
echo "Test from your local machine:"
echo "curl http://$SERVER_IP:$PORT/api/health"
echo "==================================="
```

---

### 🔟 **Common Dockploy Deployment Issues & Fixes**

#### Issue: Port not accessible from internet

```bash
# 1. Check cloud firewall (hosting provider)
#    - Go to hosting provider dashboard
#    - Add firewall rule: TCP port <port> from 0.0.0.0/0

# 2. Check UFW
sudo ufw allow <port>/tcp
sudo ufw reload

# 3. Check if Traefik is blocking
docker inspect <container> | grep traefik.enable
# If "traefik.enable=true", disable it in Dockploy

# 4. Verify port binding
docker port <container>
# Should show: <port>/tcp -> 0.0.0.0:<port>
```

#### Issue: Container not binding to 0.0.0.0

```bash
# Check current binding
docker port <container>

# Redeploy with explicit port mapping in docker-compose.yml:
ports:
  - "0.0.0.0:<host-port>:<container-port>"

# Or in Dockerfile:
EXPOSE <port>
```

---

### 1️⃣1️⃣ **Quick Deployment Checklist**

```bash
# ✅ Step-by-step verification after deployment

# 1. Container running?
docker ps | grep <app-name>

# 2. Port mapped correctly?
docker port <container> | grep <port>

# 3. Port listening on all interfaces?
netstat -tulpn | grep :<port>

# 4. Firewall allows port?
sudo ufw status | grep <port>

# 5. Test localhost
curl http://localhost:<port>/api/health

# 6. Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo "Server IP: $SERVER_IP"

# 7. Test server IP
curl http://$SERVER_IP:<port>/api/health

# 8. If step 7 fails but step 5 works:
#    → Cloud firewall is blocking
#    → Go to hosting provider and open port
```

---

### 1️⃣2️⃣ **Dockploy-Specific Settings**

When deploying in Dockploy:

1. **Disable Traefik** (for direct IP:PORT access):
   ```yaml
   traefik:
     enabled: false
   ```

2. **Set Port Mapping**:
   - Container Port: `5000` (or your app port)
   - Host Port: `5000` (same as container)
   - Protocol: `TCP`

3. **Environment Variables**:
   - Set `PORT=5000` (or your port)
   - Set `NODE_ENV=production`

4. **Health Check**:
   - Path: `/api/health`
   - Port: `5000`
   - Interval: `30s`

---

### 1️⃣3️⃣ **Emergency Debugging**

```bash
# See all networking rules
sudo iptables -L -n -v

# Check Docker iptables rules
sudo iptables -L DOCKER -n -v

# Check if port is in TIME_WAIT or CLOSE_WAIT
netstat -an | grep <port>

# Kill process on port (if needed)
sudo lsof -ti:<port> | xargs sudo kill -9

# Restart Docker
sudo systemctl restart docker

# Check Docker service status
sudo systemctl status docker

# View system logs
sudo journalctl -u docker -f
```

---

### 1️⃣4️⃣ **Pro Tips**

```bash
# Save your server IP for easy access
echo "export MY_SERVER_IP=$(curl -s ifconfig.me)" >> ~/.bashrc
source ~/.bashrc

# Quick test function - add to ~/.bashrc
testport() {
    PORT=${1:-5000}
    curl -s http://localhost:$PORT/api/health && echo "✅ OK" || echo "❌ Failed"
}

# Usage: testport 5000

# Monitor logs in real-time
docker logs -f --tail 100 <container-name>

# Check container resource usage
docker stats <container-name>

# Quick restart
docker restart <container-name>
```

---

## 📝 Example: Complete Port Check for Port 5000

```bash
# 1. Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo "Server IP: $SERVER_IP"

# 2. Check container
docker ps | grep backend

# 3. Check port mapping
docker port <container-id>

# 4. Check if listening
netstat -tulpn | grep :5000

# 5. Check firewall
sudo ufw status | grep 5000

# 6. Test locally
curl http://localhost:5000/api/health

# 7. Test with server IP
curl http://$SERVER_IP:5000/api/health

# 8. If step 7 fails:
echo "❌ Cloud firewall blocking - check hosting provider dashboard"
```

---

## 🎯 Summary for Next Project

1. Deploy app in Dockploy with **Traefik disabled**
2. Set port mapping: Container:5000 → Host:5000
3. Get server IP: `curl ifconfig.me`
4. Open port in UFW: `sudo ufw allow 5000/tcp`
5. **Open port in cloud firewall** (hosting provider dashboard)
6. Test: `curl http://<server-ip>:5000/api/health`

**Most common issue**: Cloud firewall not configured at hosting provider! ☁️🔥
