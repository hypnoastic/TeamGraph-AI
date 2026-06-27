#!/usr/bin/env bash
# Bootstrap a fresh EC2 instance: clone repo, upload .env, pull images from GHCR, start.
# Usage: ./scripts/setup-prod-server.sh [path-to.pem]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${PROD_HOST:-13.49.222.226}"
USER="${PROD_USER:-ubuntu}"
KEY="${1:-${PROD_SSH_KEY:-$ROOT/TeamGraph-AI-PROD.pem}}"
REPO="${PROD_REPO:-https://github.com/hypnoastic/TeamGraph-AI.git}"
REMOTE_DIR="teamgraph"

if [[ ! -f "$KEY" ]]; then
  echo "SSH key not found: $KEY" >&2
  exit 1
fi
if [[ ! -f "$ROOT/.env" ]]; then
  echo "Missing $ROOT/.env" >&2
  exit 1
fi

chmod 400 "$KEY"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=no "$USER@$HOST")
SCP=(scp -i "$KEY" -o StrictHostKeyChecking=no)

echo "==> Ensuring Docker is installed on $HOST ..."
"${SSH[@]}" 'bash -s' <<'REMOTE'
set -euo pipefail
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker ubuntu
fi
sudo docker compose version
REMOTE

echo "==> Cloning repo and uploading .env only ..."
"${SSH[@]}" "bash -s" <<REMOTE
set -euo pipefail
rm -rf ~/${REMOTE_DIR}
git clone --depth 1 ${REPO} ~/${REMOTE_DIR}
REMOTE

"${SCP[@]}" "$ROOT/.env" "$USER@$HOST:~/$REMOTE_DIR/.env"
"${SCP[@]}" "$ROOT/deploy/nginx.conf" "$USER@$HOST:~/$REMOTE_DIR/deploy/nginx.conf"
"${SCP[@]}" "$ROOT/docker-compose.prod.yml" "$USER@$HOST:~/$REMOTE_DIR/docker-compose.prod.yml"

echo "==> Pulling pre-built images and starting ..."
"${SSH[@]}" 'bash -s' <<'REMOTE'
set -euo pipefail
cd ~/teamgraph
echo '{}' > google-credentials.json
sudo docker compose -f docker-compose.prod.yml --env-file .env pull api web
sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --no-build --pull missing api web nginx
sudo docker compose -f docker-compose.prod.yml ps
curl -sf http://localhost/health && echo " OK" || echo "health check pending..."
REMOTE

echo "==> Done. Check https://13.49.222.226.nip.io/health"
