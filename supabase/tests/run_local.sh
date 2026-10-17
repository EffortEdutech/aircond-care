#!/usr/bin/env bash
# run_local.sh
# Applies the migrations to a scratch database on a local Postgres and runs the test suite.
#
# Usage:   PGHOST=/tmp/pgtest PGUSER=pgtest ./supabase/tests/run_local.sh
# Needs:   a running Postgres 15+ (the schema uses UNIQUE NULLS NOT DISTINCT) and a superuser.
# It creates a database called ac_marketplace_test, runs everything, then drops it.
set -euo pipefail

# Inside the Docker container, exec runs as root; connect as the postgres superuser instead.
export PGUSER="${PGUSER:-postgres}"

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"
db="${TEST_DB:-ac_marketplace_test}"
psql_base=(psql -v ON_ERROR_STOP=1 -X -q)

"${psql_base[@]}" -d postgres -c "drop database if exists ${db}" -c "create database ${db}"
trap '"${psql_base[@]}" -d postgres -c "drop database if exists '"${db}"'" >/dev/null' EXIT

echo "== stubs"
"${psql_base[@]}" -d "$db" -f "$here/support/local_stubs.sql"

for f in "$root"/migrations/*.sql; do
  echo "== migrate $(basename "$f")"
  "${psql_base[@]}" -d "$db" -f "$f"
done

for f in "$here"/[0-9]*.sql; do
  echo "== test $(basename "$f")"
  "${psql_base[@]}" -d "$db" -f "$f"
done

echo "== all tests passed"
