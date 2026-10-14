#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"
: "${PROJECT_REF:?PROJECT_REF is required}"
: "${SITE_URL:?SITE_URL is required}"

template="$(dirname "$0")/../templates/login-code.html"

payload=$(jq -n \
  --arg site_url "$SITE_URL" \
  --arg allow_list "$SITE_URL/**,http://localhost:4200/**" \
  --arg template "$(cat "$template")" \
  --arg smtp_pass "${SUPABASE_SMTP_PASSWORD:-}" \
  '{
    site_url: $site_url,
    uri_allow_list: $allow_list,
    disable_signup: true,
    external_email_enabled: true,
    mailer_otp_length: 6,
    mailer_otp_exp: 600,
    mailer_subjects_magic_link: "Dein Login-Code für die Chnorrlimorrli-Verwaltung",
    mailer_templates_magic_link_content: $template
  }
  + (if $smtp_pass == "" then {} else {
    smtp_host: "smtp.azurecomm.net",
    smtp_port: "587",
    smtp_user: "supabase-auth@chnorrlimorrli.ch",
    smtp_pass: $smtp_pass,
    smtp_admin_email: "noreply@chnorrlimorrli.ch",
    smtp_sender_name: "Chnorrlimorrli",
    rate_limit_email_sent: 30
  } end)')

status=$(curl --silent --output /dev/null --write-out '%{http_code}' \
  --request PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  --header "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data "$payload")

if [[ "$status" != 200 ]]; then
  echo "Auth configuration failed with HTTP $status" >&2
  exit 1
fi
echo "Auth configuration updated"
