#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="$ROOT_DIR/prisma/dev.db"

rm -f "$DB_PATH" "$DB_PATH-shm" "$DB_PATH-wal"

npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel "$ROOT_DIR/prisma/schema.prisma" \
  --script | sqlite3 "$DB_PATH"

echo "SQLite schema created at $DB_PATH"
