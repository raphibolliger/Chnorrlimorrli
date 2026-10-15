#!/usr/bin/env bash
set -euo pipefail

project_ref="${1:?Usage: remote-service-key.sh project-ref}"

supabase projects api-keys --project-ref "$project_ref" --reveal --output json \
  | jq -r 'map(select(.type == "secret" or .name == "service_role")) | first | .api_key'
