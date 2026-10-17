# Local database with Docker

Runs Postgres 16 in a container and loads the whole schema on first start. This is for building and testing. It is plain Postgres with stand-ins for Supabase's roles and `auth` schema, not the full Supabase stack.

## Needs

Docker Desktop (or any Docker with Compose v2), running.

## Start

From the project folder:

```
docker compose up -d
docker compose logs db        # look for "== schema ready"
```

First start applies the stand-ins and all ten migrations. Later starts keep your data.

Connection string: `postgresql://postgres:postgres@127.0.0.1:54322/marketplace`

Open a SQL prompt:

```
docker compose exec db psql -U postgres -d marketplace
```

## Run the tests

```
docker compose exec -T -u postgres db bash /workspace/tests/run_local.sh
```

The tests build their own scratch database and drop it, so your data is untouched. Expect `all tests passed`.

## Reset to a clean schema

Deletes everything in the local database, then rebuilds it.

```
docker compose down -v
docker compose up -d
```

## After changing a migration

Initial setup only runs on an empty volume. Either reset (above), or apply one file by hand:

```
docker compose exec -T db psql -U postgres -d marketplace -f /workspace/migrations/0011_your_change.sql
```

## Settings

Copy `.env.example` to `.env` to change the password or port (default 54322). The port is bound to this computer only.

## Limits

- No GoTrue, so there is no real sign-up. `auth.users` is a plain table; insert a row and the profile is created by trigger.
- No Storage, API gateway or Studio. To get those, use the Supabase CLI (`supabase init`, then `supabase start`), which needs Docker too and uses the same migrations.
