#!/bin/bash
# Runs once, the first time the database volume is created.
# Loads the Supabase stand-ins, then every migration in order.
set -euo pipefail
psql_run=(psql -v ON_ERROR_STOP=1 -X -q -U "$POSTGRES_USER" -d "$POSTGRES_DB")

echo "== stand-ins for Supabase roles and auth"
"${psql_run[@]}" -f /workspace/tests/support/local_stubs.sql

for f in /workspace/migrations/*.sql; do
  echo "== $(basename "$f")"
  "${psql_run[@]}" -f "$f"
done
echo "== schema ready"
