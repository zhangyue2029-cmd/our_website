#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

password=$(node -p 'require("node:crypto").randomBytes(18).toString("hex")')
container=$(docker run --rm -d -p 127.0.0.1::5432 -e "POSTGRES_PASSWORD=$password" postgres:17-alpine)
trap 'docker stop "$container" >/dev/null 2>&1 || true' EXIT

for attempt in {1..60}; do
  if docker exec "$container" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  if [[ "$attempt" == 60 ]]; then exit 1; fi
  sleep 0.25
done
docker exec -i "$container" psql -Xq -U postgres -v ON_ERROR_STOP=1 < db/accounts/001_accounts.sql
docker exec -i "$container" psql -Xq -U postgres -v ON_ERROR_STOP=1 < db/accounts/002_reports.sql
docker exec -i "$container" psql -Xq -U postgres -v ON_ERROR_STOP=1 < db/community/001_posts.sql
binding=$(docker port "$container" 5432/tcp)
export QX_DATABASE_URL="postgresql://postgres:${password}@${binding}/postgres"
if [[ $# -gt 0 ]]; then
  "$@"
else
  node --test tests/accounts-db.mjs
fi
