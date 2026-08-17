#!/bin/bash
# =============================================================================
# check-version-bump.sh - fail CI if a commit landed without a changelog bump
# =============================================================================
# Usage:
#   bash scripts/check-version-bump.sh HEAD~1..HEAD
#   bash scripts/check-version-bump.sh <from-ref>..<to-ref>     # default = HEAD~1..HEAD
#   bash scripts/check-version-bump.sh                         # examines HEAD~1..HEAD
#
# Exits 0 if the range's diff contains a change to src/data/changelog.json
# OR if every changed file is a non-user-facing path (.md, scripts/, docs/, etc).
# Exits 1 if user-facing files (src/, server/, apps/, sdks/) were changed
# WITHOUT a corresponding changelog bump.
#
# Wire-up example:
#   - pre-commit hook
#   - GitHub Actions step: - run: bash scripts/check-version-bump.sh ${{ github.event.before }}..${{ github.event.after }}
#   - run by your AI agent after every deployable change
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

RANGE="${1:-HEAD~1..HEAD}"

# If we're not in a git repo, skip the check (e.g. deploy on a fresh clone)
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Not a git repo - skipping version-bump check."
  exit 0
fi

# Empty range (e.g. first commit) → trivially OK
if ! git rev-parse "${RANGE%%..*}" >/dev/null 2>&1; then
  echo "Range '${RANGE}' has no 'from' ref - skipping (initial commit?)."
  exit 0
fi

CHANGED=$(git diff --name-only "$RANGE" 2>/dev/null || true)

# Helper: classify a path as user-facing
is_user_facing() {
  case "$1" in
    src/*)               return 0 ;;
    server/*)            return 0 ;;
    apps/*)              return 0 ;;
    sdks/*)              return 0 ;;
    public/*)            return 0 ;;
    *)                   return 1 ;;
  esac
}

# Did this range already update the changelog?
CHANGELOG_TOUCHED=false
USER_FACING_CHANGED=false

for f in $CHANGED; do
  case "$f" in
    src/data/changelog.json) CHANGELOG_TOUCHED=true ;;
  esac
  if is_user_facing "$f"; then
    USER_FACING_CHANGED=true
  fi
done

if [ "$USER_FACING_CHANGED" = false ]; then
  echo "✓ No user-facing files in range - no changelog bump needed."
  exit 0
fi

if [ "$CHANGELOG_TOUCHED" = true ]; then
  echo "✓ User-facing changes AND changelog bump detected in ${RANGE}."
  exit 0
fi

echo "✗ User-facing files changed in ${RANGE} but src/data/changelog.json was not updated."
echo ""
echo "Changed user-facing files:"
for f in $CHANGED; do
  if is_user_facing "$f"; then
    echo "  - $f"
  fi
done
echo ""
echo "Fix one of:"
echo "  - bash scripts/update-changelog.sh            # auto-bump (patch by default)"
echo "  - BUMP_TYPE=minor   bash scripts/update-changelog.sh"
echo "  - BUMP_TYPE=major   bash scripts/update-changelog.sh"
echo "  - or hand-edit src/data/changelog.json with HIGHLIGHTS='...'"
exit 1