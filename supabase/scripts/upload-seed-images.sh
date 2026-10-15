#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${PROJECT_REF:-}" ]]; then
  SUPABASE_URL="https://$PROJECT_REF.supabase.co"
  SUPABASE_SERVICE_KEY="$("$(dirname "$0")/remote-service-key.sh" "$PROJECT_REF")"
else
  : "${SUPABASE_URL:?SUPABASE_URL is required}"
  : "${SUPABASE_SERVICE_KEY:?SUPABASE_SERVICE_KEY is required}"
fi

image_dir="$(dirname "$0")/../seed/product-images"

for file in "$image_dir"/*.webp; do
  name="$(basename "$file")"
  status=$(curl --silent --output /dev/null --write-out '%{http_code}' \
    --request POST "$SUPABASE_URL/storage/v1/object/product-images/seed/$name" \
    --header "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    --header "apikey: $SUPABASE_SERVICE_KEY" \
    --header "Content-Type: image/webp" \
    --header "Cache-Control: max-age=31536000" \
    --header "x-upsert: true" \
    --data-binary "@$file")
  if [[ "$status" != 200 ]]; then
    echo "Upload of $name failed with HTTP $status" >&2
    exit 1
  fi
  echo "Uploaded seed/$name"
done
