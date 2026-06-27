#!/usr/bin/env bash
# Manual prod recovery: upload .env + nginx, pull GHCR images, restart.
# Usage: ./scripts/recover-prod.sh [path-to.pem]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${PROD_HOST:-13.49.222.226}"
USER="${PROD_USER:-ubuntu}"
KEY="${1:-${PROD_SSH_KEY:-$ROOT/TeamGraph-AI-PROD.pem}}"
REMOTE_DIR="~/teamgraph"

if [[ ! -f "$KEY" ]]; then
  echo "SSH key not found: $KEY" >&2
  exit 1
fi
if [[ ! -f "$ROOT/.env" ]]; then
  echo "Missing $ROOT/.env — create it from .env.example first." >&2
  exit 1
fi

chmod 400 "$KEY"

echo "==> Checking SSH to $USER@$HOST ..."
ssh -i "$KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=20 "$USER@$HOST" 'echo connected && uptime'

echo "==> Updating .env and nginx.conf ..."
ssh -i "$KEY" -o StrictHostKeyChecking=no "$USER@$HOST" "mkdir -p $REMOTE_DIR/deploy"
scp -i "$KEY" -o StrictHostKeyChecking=no \
  "$ROOT/.env" \
  "$USER@$HOST:$REMOTE_DIR/.env"
scp -i "$KEY" -o StrictHostKeyChecking=no \
  "$ROOT/deploy/nginx.conf" \
  "$USER@$HOST:$REMOTE_DIR/deploy/nginx.conf"

echo "==> Pulling images and restarting (no build) ..."
ssh -i "$KEY" -o StrictHostKeyChecking=no "$USER@$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd ~/teamgraph
echo '{}' > google-credentials.json
sudo docker compose -f docker-compose.prod.yml --env-file .env pull api web
sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --no-build --pull missing api web nginx
sudo docker compose -f docker-compose.prod.yml ps
curl -sf http://localhost/health && echo " OK" || true
REMOTE

echo "==> Done. Check https://13.49.222.226.nip.io/health"
