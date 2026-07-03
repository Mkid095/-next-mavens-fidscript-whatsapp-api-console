#!/bin/bash
# =============================================================================
# update-changelog.sh — append a new entry to src/data/changelog.json
# =============================================================================
# Usage:
#   BUMP_TYPE=patch   bash scripts/update-changelog.sh              # v0.4.0 → v0.4.1
#   BUMP_TYPE=minor   bash scripts/update-changelog.sh              # v0.4.x → v0.5.0
#   BUMP_TYPE=major   bash scripts/update-changelog.sh              # v0.x.y → v1.0.0
#
#   TITLE="New feature X" HIGHLIGHTS="first;;second" \
#     FIXES="small fix" CATEGORY="feature" TAGS="cli,api" \
#     bash scripts/update-changelog.sh
#
# Semver discipline:
#   patch  — bug fixes, small UI tweaks, perf improvements, dark-mode fixes
#   minor  — new features, new endpoints, new CLI subcommands (no breaking changes)
#   major  — breaking API changes, auth model changes, schema redesigns
#
# The script is idempotent — running twice for the same version is a no-op.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

CHANGELOG="src/data/changelog.json"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo 'pending')"
COMMIT_FULL="$(git rev-parse HEAD 2>/dev/null || echo 'pending')"
DATE="$(date -u +%Y-%m-%d)"
BUMP_TYPE="${BUMP_TYPE:-patch}"
TITLE="${TITLE:-Release ${DATE}}"
HIGHLIGHTS="${HIGHLIGHTS:-}"
FIXES="${FIXES:-}"
CATEGORY="${CATEGORY:-release}"
TAGS="${TAGS:-}"

if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
  echo "ERROR: BUMP_TYPE must be one of: major, minor, patch (got: '$BUMP_TYPE')" >&2
  exit 1
fi

# Read the current latest version and compute the next one
LATEST_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CHANGELOG','utf8')).latest.replace(/^v/,''))")
LATEST_MAJOR=$(echo "$LATEST_VERSION" | cut -d. -f1)
LATEST_MINOR=$(echo "$LATEST_VERSION" | cut -d. -f2)
LATEST_PATCH=$(echo "$LATEST_VERSION" | cut -d. -f3)

case "$BUMP_TYPE" in
  patch) NEW_PATCH=$((LATEST_PATCH + 1)); NEXT="v${LATEST_MAJOR}.${LATEST_MINOR}.${NEW_PATCH}" ;;
  minor) NEW_MINOR=$((LATEST_MINOR + 1)); NEXT="v${LATEST_MAJOR}.${NEW_MINOR}.0" ;;
  major) NEW_MAJOR=$((LATEST_MAJOR + 1));    NEXT="v${NEW_MAJOR}.0.0" ;;
esac

# Idempotency — bail out if the latest version already matches
EXISTING_LATEST=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CHANGELOG','utf8')).latest)" 2>/dev/null || echo "")
if [ "$EXISTING_LATEST" = "$NEXT" ]; then
  echo "Changelog already has $NEXT — skipping."
  exit 0
fi

# Confirm with the caller (skip when run non-interactively with --yes / YES=1)
if [ -t 0 ] && [ "${YES:-}" != "1" ]; then
  echo ""
  echo "  Current:  $EXISTING_LATEST"
  echo "  Bump:     $BUMP_TYPE"
  echo "  Next:     $NEXT"
  echo "  Title:    $TITLE"
  echo "  Highlights: ${HIGHLIGHTS:-<none>}"
  echo "  Fixes:      ${FIXES:-<none>}"
  echo "  Tags:        ${TAGS:-<none>}"
  echo ""
  read -p "  Append $NEXT to changelog.json? [y/N] " ans
  case "$ans" in y|Y|yes|YES) ;; *) echo "Aborted."; exit 1 ;; esac
fi

# Build the new entry
node - <<EOF
const fs = require('fs');
const path = '$CHANGELOG';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const title = process.env.TITLE || '';
const highlights = (process.env.HIGHLIGHTS || '').split(';;').map(s => s.trim()).filter(Boolean);
const fixes = (process.env.FIXES || '').split(';;').map(s => s.trim()).filter(Boolean);
const tags = (process.env.TAGS || '').split(',').map(s => s.trim()).filter(Boolean);
const commits = (process.env.COMMIT_HASH || '$COMMIT').split(';;').map(s => s.trim()).filter(Boolean);

// Validate — refuse to write a near-empty entry
const errors = [];
if (!title) errors.push('TITLE env var is required (e.g. TITLE="New feature X").');
if (!highlights.length && !fixes.length) errors.push('At least one of HIGHLIGHTS or FIXES must be provided (use ;;; as separator).');
if (errors.length) {
  for (const e of errors) console.error('  •', e);
  console.error('\\nExample:');
  console.error('  TITLE="New endpoint" \\\\');
  console.error('    HIGHLIGHTS="Added POST /api/v1/groups/create;;Fixed pagination" \\\\');
  console.error('    FIXES="" \\\\');
  console.error('    TAGS="groups,api" \\\\');
  console.error('    BUMP_TYPE=minor bash scripts/update-changelog.sh');
  process.exit(1);
}

const entry = {
  version: '$NEXT',
  date: '$DATE',
  bumpType: '$BUMP_TYPE',
  title,
  category: process.env.CATEGORY || 'release',
  tags,
  highlights,
  fixes,
  commits,
};

data.entries.unshift(entry);
data.latest = entry.version;
fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log('✓ Wrote', entry.version, 'to', path);
EOF

echo ""
echo "Next steps:"
echo "  1. Edit src/data/changelog.json — fill in highlights/fixes/commit hashes"
echo "  2. Commit: git add src/data/changelog.json && git commit -m 'chore(changelog): $NEXT'"
echo "  3. Push + deploy: git push origin main && bash deploy.sh"