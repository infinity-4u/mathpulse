# Deployment Guide — maths.graphsight.app

**Platform:** Hetzner VPS · Caddy + Docker Compose  
**Full platform reference:** `SERVER_DEPLOYMENT_GUIDE.md` in the graphsight docs repo  
**Live URL:** https://maths.graphsight.app (basic auth required — see `.deploy.env` locally)

> **Credentials are NOT in this file.** Store them in a local `.deploy.env` that is git-ignored.
> See `.deploy.env.example` below for the shape.

---

## The one rule

**Use password auth, not SSH keys.** The `~/.ssh/graphsight` key does not work for deploys.
Connect with `sshpass` and the password from `.deploy.env`:

```bash
source .deploy.env
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_HOST
```

If `sshpass` is not installed: `brew install sshpass`

---

## Local `.deploy.env` (git-ignored, create once per machine)

```bash
# .deploy.env — never commit this file
VPS_HOST=46.225.90.190
VPS_USER=root
VPS_PASSWORD=<see team 1Password / shared secrets>
VPS_APP_PATH=/opt/maths-app
```

---

## Server layout for this app

| Thing | Value |
|---|---|
| Server IP | 46.225.90.190 |
| SSH user | root (password in `.deploy.env`) |
| Code on VPS | `/opt/maths-app/` |
| Compose file | `/opt/maths-app/deploy/docker-compose.yml` (project name `deploy`) |
| Container name | `maths-app` (image: `deploy-maths`) |
| Host port → container | 3005 → 3000 |
| Caddy routes | `maths.graphsight.app → localhost:3005` |
| Server env file | `/opt/maths-app/.env.local` — **never overwrite** (Supabase keys live here) |

---

## Standard redeploy (after every code change)

Run all three steps in order. Takes ~2 minutes.

```bash
source .deploy.env   # load VPS_HOST, VPS_PASSWORD, VPS_APP_PATH
```

### Step 1 — Sync code to VPS

```bash
sshpass -p "$VPS_PASSWORD" rsync -az \
  --exclude .git --exclude node_modules --exclude .next \
  --exclude .env.local --exclude .env --exclude .deploy.env \
  -e "ssh -o StrictHostKeyChecking=no" \
  "/Users/hus036/Desktop/untitled folder/aus-maths-app/" \
  root@$VPS_HOST:$VPS_APP_PATH/
```

The `--exclude .env.local` keeps the server's Supabase keys intact.

### Step 2 — Rebuild image and restart container

```bash
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_HOST "
  cd $VPS_APP_PATH/deploy &&
  docker compose -p deploy build &&
  docker stop maths-app && docker rm maths-app &&
  docker compose -p deploy up -d
"
```

`docker stop` + `docker rm` before `up -d` is required because the container has a fixed `container_name`. Skip it and Compose errors on name conflict.

### Step 3 — Verify

```bash
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_HOST \
  "curl -s -o /dev/null -w 'local 3005 -> %{http_code}\n' http://localhost:3005/"
```

Expected: `local 3005 -> 200`

---

## Useful one-liners

```bash
source .deploy.env

# Container status
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_HOST \
  "docker ps --filter name=maths-app"

# Tail live logs
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_HOST \
  "docker logs maths-app -f --tail 50"

# Shell into container
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_HOST \
  "docker exec -it maths-app sh"
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Permission denied (publickey,password)` | Tried SSH key | Load `.deploy.env` and use `sshpass` |
| `local 3005 -> 502` | Container crashed at startup | `docker logs maths-app --tail 30` |
| `local 3005 -> 000` | Container not running | Rerun Step 2 |
| Name conflict: `container already exists` | Old container not removed | `docker rm -f maths-app` then re-run |
| 502 but container running | Next.js still booting | Wait 15s and retry |

---

## Caddy config for this app

The block is already live. If it ever needs to be re-added to `/etc/caddy/Caddyfile`:

```caddy
maths.graphsight.app {
    basic_auth /* {
        admin <bcrypt hash — generate with: caddy hash-password --plaintext 'password'>
    }
    reverse_proxy localhost:3005
}
```

Then: `systemctl reload caddy`
