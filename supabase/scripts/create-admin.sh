#!/usr/bin/env bash
set -euo pipefail

email="${1:?Usage: create-admin.sh email}"
email="$(printf '%s' "$email" | tr '[:upper:]' '[:lower:]')"

if [[ -n "${PROJECT_REF:-}" ]]; then
  : "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required for a remote project}"
  SUPABASE_URL="https://$PROJECT_REF.supabase.co"
  SUPABASE_SERVICE_KEY=$(supabase projects api-keys --project-ref "$PROJECT_REF" --reveal --output json \
    | jq -r 'map(select(.type == "secret")) | first | .api_key')
else
  : "${SUPABASE_URL:?SUPABASE_URL is required}"
  : "${SUPABASE_SERVICE_KEY:?SUPABASE_SERVICE_KEY is required}"
  : "${DATABASE_URL:?DATABASE_URL is required}"
fi

response=$(curl --silent --show-error \
  --request POST "$SUPABASE_URL/auth/v1/admin/users" \
  --header "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  --header "apikey: $SUPABASE_SERVICE_KEY" \
  --header "Content-Type: application/json" \
  --data "{\"email\": \"$email\", \"email_confirm\": true}")

if ! printf '%s' "$response" | grep -q '"id"' && ! printf '%s' "$response" | grep -q 'email_exists'; then
  echo "Creating the auth user failed: $response" >&2
  exit 1
fi

grant_sql="insert into app.admins (user_id) select id from auth.users where email = '$email' on conflict (user_id) do nothing;"

if [[ -n "${PROJECT_REF:-}" ]]; then
  status=$(curl --silent --output /dev/null --write-out '%{http_code}' \
    --request POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
    --header "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    --header "Content-Type: application/json" \
    --data "$(jq -n --arg query "$grant_sql" '{query: $query}')")
  [[ "$status" == 201 || "$status" == 200 ]] || { echo "Granting admin access failed with HTTP $status" >&2; exit 1; }
else
  psql "$DATABASE_URL" --quiet --set ON_ERROR_STOP=1 --command "$grant_sql"
fi

echo "Admin access granted to $email"
