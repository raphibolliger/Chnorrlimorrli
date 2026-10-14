#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_SERVICE_KEY:?SUPABASE_SERVICE_KEY is required}"
: "${DATABASE_URL:?DATABASE_URL is required}"

email="${1:?Usage: create-admin.sh email}"
email="$(printf '%s' "$email" | tr '[:upper:]' '[:lower:]')"

response=$(curl --silent --show-error --fail-with-body \
  --request POST "$SUPABASE_URL/auth/v1/admin/users" \
  --header "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  --header "apikey: $SUPABASE_SERVICE_KEY" \
  --header "Content-Type: application/json" \
  --data "{\"email\": \"$email\", \"email_confirm\": true}" || true)

if ! printf '%s' "$response" | grep -q '"id"' && ! printf '%s' "$response" | grep -q 'email_exists'; then
  echo "Creating the auth user failed: $response" >&2
  exit 1
fi

psql "$DATABASE_URL" --quiet --set ON_ERROR_STOP=1 --set email="$email" <<'SQL'
insert into app.admins (user_id)
select id from auth.users where email = :'email'
on conflict (user_id) do nothing;
SQL

echo "Admin access granted to $email"
