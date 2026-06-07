#!/usr/bin/env node
/**
 * VPS üzerinde API güncelleme (SSH ile çalıştırın).
 * Örnek: ssh user@sunucu 'bash -s' < scripts/vps-update-api.sh
 */
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/tedris-vbs}"
BRANCH="${BRANCH:-main}"

echo "==> Tedris VBS API güncelleniyor: $REPO_DIR ($BRANCH)"

cd "$REPO_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm --filter @workspace/api-server run build

if command -v docker >/dev/null 2>&1 && docker compose ps api >/dev/null 2>&1; then
  docker compose up -d --build api
elif command -v pm2 >/dev/null 2>&1; then
  pm2 restart tedris-api || pm2 restart api-server || pm2 restart all
else
  echo "Docker/pm2 bulunamadı — servisi elle yeniden başlatın."
fi

echo "==> Şema onarımı (opsiyonel): curl -X POST https://api.antalyanehari.xyz/api/setup-schema"
echo "==> Bitti. /api/health ile kontrol edin."
