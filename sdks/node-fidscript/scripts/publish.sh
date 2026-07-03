#!/bin/bash
# =============================================================================
# Publish @nextmavens/fidscript to npm
# =============================================================================
# Usage:
#   NPM_PUBLISH_TOKEN=npm_xxx ./scripts/publish.sh
#
# The token must be a "Granular Access Token" with:
#   - Read & Write on the @nextmavens scope
#   - "Bypass 2FA for publish" enabled
#   - 1-year expiry (recommended)
#
# Generate one at https://www.npmjs.com/settings/<username>/tokens
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

if [ -z "${NPM_PUBLISH_TOKEN:-}" ]; then
  echo "ERROR: Set NPM_PUBLISH_TOKEN env var first." >&2
  echo "  Get a token at https://www.npmjs.com/settings/<username>/tokens" >&2
  echo "  Required: Read & Write on @nextmavens scope + Bypass 2FA" >&2
  exit 1
fi

# Build first
npm run clean
npm run build

# Use a per-call .npmrc so the token never persists on disk
NPMRC="$(mktemp)"
cat > "${NPMRC}" <<EOF
//registry.npmjs.org/:_authToken=${NPM_PUBLISH_TOKEN}
EOF

trap 'rm -f "${NPMRC}"' EXIT

# Bump version if VERSION env var is set
if [ -n "${VERSION:-}" ]; then
  echo "→ Bumping version to ${VERSION}"
  npm version "${VERSION}" --no-git-tag-version
fi

# Dry-run first, then real
echo ""
echo "=== Dry-run ==="
NPM_CONFIG_USERCONFIG="${NPMRC}" npm publish --access=public --dry-run

echo ""
echo "=== Publishing ==="
NPM_CONFIG_USERCONFIG="${NPMRC}" npm publish --access=public

echo ""
echo "✓ Published. Verify at:"
echo "  https://www.npmjs.com/package/@nextmavens/fidscript"