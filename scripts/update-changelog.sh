#!/bin/bash
# =============================================================================
# update-changelog.sh — append a new entry to src/data/changelog.json
# =============================================================================
# Usage (called automatically by deploy.sh):
#   VERSION=v0.5.0 TITLE="New feature" \
#     HIGHLIGHTS="first highlight;;second highlight" \
#     FIXES="one fix" \
#     bash scripts/update-changelog.sh
#
# All args are optional. If VERSION is unset, uses today's ISO date + commit hash.
# If HIGHLIGHTS/FIXES are empty, the entry has only the title (useful for trivial
# patch deploys).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

CHANGELOG="src/data/changelog.json"
COMMIT="$(git rev-parse --short HEAD)"
DATE="$(date -u +%Y-%m-%d)"
VERSION="${VERSION:-}"
TITLE="${TITLE:-}"
HIGHLIGHTS="${HIGHLIGHTS:-}"
FIXES="${FIXES:-}"

# If no version provided, derive from git describe or commit + date
if [ -z "$VERSION" ]; then
  if git describe --tags --exact-match HEAD 2>/dev/null; then
    VERSION="$(git describe --tags --exact-match HEAD)"
  else
    VERSION="unreleased-${COMMIT:0:7}"
  fi
fi

# Skip if the latest entry already matches this version (idempotent)
LATEST_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('${CHANGELOG}','utf8')).latest)" 2>/dev/null || echo "")
if [ "$LATEST_VERSION" = "$VERSION" ]; then
  echo "Changelog already has $VERSION — skipping."
  exit 0
fi

node - <<EOF
const fs = require('fs');
const path = '${CHANGELOG}';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const version = process.env.VERSION || 'unreleased';
const title = process.env.TITLE || version;
const highlights = (process.env.HIGHLIGHTS || '').split(';;').map(s => s.trim()).filter(Boolean);
const fixes = (process.env.FIXES || '').split(';;').map(s => s.trim()).filter(Boolean);
const commits = (process.env.COMMIT_HASH || '${COMMIT}').split(';;').map(s => s.trim()).filter(Boolean);
data.entries.unshift({ version, date: '${DATE}', title, highlights, fixes, commits });
data.latest = version;
fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log('Wrote', version, 'to', path);
EOF