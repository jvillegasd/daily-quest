#!/usr/bin/env bash
# Deploy this app to Coolify and wait for the result.
# Usage: ./scripts/deploy.sh [--app-uuid UUID] [--url URL] [--token TOKEN]
# Defaults come from environment variables: COOLIFY_URL, COOLIFY_TOKEN, COOLIFY_APP_UUID

set -euo pipefail

COOLIFY_URL="${COOLIFY_URL:-https://coolify.jvillegasd.com}"
COOLIFY_TOKEN="${COOLIFY_TOKEN:-}"
APP_UUID="${COOLIFY_APP_UUID:-rdnmg3yjy61zzyjzf4ock01i}"
POLL_INTERVAL=10
TIMEOUT=600

while [[ $# -gt 0 ]]; do
  case $1 in
    --app-uuid) APP_UUID="$2"; shift 2 ;;
    --url)      COOLIFY_URL="$2"; shift 2 ;;
    --token)    COOLIFY_TOKEN="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$COOLIFY_TOKEN" ]]; then
  echo "Error: COOLIFY_TOKEN not set" >&2
  exit 1
fi

api() { curl -sf -H "Authorization: Bearer $COOLIFY_TOKEN" -H "Content-Type: application/json" "$@"; }

echo "Triggering deployment for $APP_UUID …"
DEPLOY=$(api -X POST "$COOLIFY_URL/api/v1/applications/$APP_UUID/start")
DEPLOY_UUID=$(echo "$DEPLOY" | python3 -c "import sys,json; print(json.load(sys.stdin)['deployment_uuid'])")
echo "Deployment queued: $DEPLOY_UUID"

elapsed=0
while true; do
  STATUS=$(api "$COOLIFY_URL/api/v1/deployments/$DEPLOY_UUID" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))")
  echo "[${elapsed}s] status: $STATUS"

  if [[ "$STATUS" == "finished" ]]; then
    echo "Deployment succeeded."
    exit 0
  fi

  if [[ "$STATUS" == "failed" || "$STATUS" == "error" ]]; then
    echo "Deployment failed. Fetching last log lines …" >&2
    api "$COOLIFY_URL/api/v1/deployments/$DEPLOY_UUID" | python3 -c "
import sys, json
d = json.load(sys.stdin)
logs_raw = d.get('logs', '[]') or '[]'
try:
    logs = json.loads(logs_raw) if isinstance(logs_raw, str) else logs_raw
    for e in logs[-20:]:
        out = e.get('output','').strip()
        if out: print(f'  [{e.get(\"type\",\"\")}] {out[:300]}')
except: print(logs_raw[-1000:])
" >&2
    exit 1
  fi

  if [[ $elapsed -ge $TIMEOUT ]]; then
    echo "Timed out after ${TIMEOUT}s." >&2
    exit 1
  fi

  sleep $POLL_INTERVAL
  elapsed=$((elapsed + POLL_INTERVAL))
done
