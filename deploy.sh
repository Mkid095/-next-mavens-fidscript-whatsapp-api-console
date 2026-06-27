#!/bin/bash
# =============================================================================
# FIDScript WhatsApp - Smart Deployment Script
# =============================================================================
# Detects changes and only rebuilds what is necessary (frontend, backend, or both)
# Logs all operations to deploy.log with timestamps
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/deploy.log"
DB_PATH="${SCRIPT_DIR}/server/fidscript.db"

# =============================================================================
# Logging Functions
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] ${message}" | tee -a "${LOG_FILE}" >&2
}

log_info() {
    log "INFO" "$@"
}

log_warn() {
    log "WARN" "$@"
}

log_error() {
    log "ERROR" "$@"
}

log_success() {
    log "SUCCESS" "$@"
}

# =============================================================================
# Pre-deployment Checks
# =============================================================================

# Guard: refuse to run from inside server/ directory
if basename "$(pwd)" | grep -q "server"; then
    echo "[ERROR] Do not run deploy.sh from inside the server/ directory." >&2
    echo "[ERROR] Run it from the project root: bash deploy.sh" >&2
    exit 1
fi

check_prerequisites() {
    log_info "Checking prerequisites..."

    if [ ! -d ".git" ]; then
        log_error "Not a git repository. Aborting."
        exit 1
    fi

    if ! command -v git >/dev/null 2>&1; then
        log_error "git command not found. Aborting."
        exit 1
    fi

    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm command not found. Aborting."
        exit 1
    fi

    # Refuse to deploy with uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        log_error "Uncommitted changes detected. Commit or stash before deploying. Aborting."
        echo "" >&2
        echo "Uncommitted files:" >&2
        git status --short >&2
        exit 1
    fi

    # Refuse if local is ahead of origin — pulling origin/main would silently
    # rebuild older code (because deploy.sh uses `git pull origin main`).
    # Without this, a developer can commit locally, run deploy.sh, and end up
    # shipping the OLD code without any error indication.
    if git rev-parse --abbrev-ref --symbolic @{u} >/dev/null 2>&1; then
        local unpushed
        unpushed=$(git log --oneline @{u}..HEAD 2>/dev/null)
        if [ -n "${unpushed}" ]; then
            log_error "Local branch is ahead of origin with unpushed commits:"
            echo "" >&2
            echo "${unpushed}" >&2
            echo "" >&2
            log_error "deploy.sh pulls from origin/main — running it now would deploy the OLD code."
            log_error "Push first, then deploy:"
            echo "    git push origin main && bash deploy.sh" >&2
            exit 1
        fi
    fi

    log_info "Prerequisites check passed."
}

# =============================================================================
# Git Operations
# =============================================================================

git_pull() {
    log_info "Pulling latest changes from origin/main..."
    git pull origin main 2>&1 | tee -a "${LOG_FILE}"
    log_success "Git pull completed."
}

LAST_DEPLOY_FILE="${SCRIPT_DIR}/.last_deploy_commit"

get_last_deploy_commit() {
    if [ -f "${LAST_DEPLOY_FILE}" ]; then
        cat "${LAST_DEPLOY_FILE}"
    else
        # Fallback: previous commit (for first run)
        git rev-parse HEAD~1 2>/dev/null || echo ""
    fi
}

save_last_deploy_commit() {
    git rev-parse HEAD > "${LAST_DEPLOY_FILE}"
}

get_changed_files() {
    local last_commit
    last_commit=$(get_last_deploy_commit)
    if [ -z "${last_commit}" ]; then
        echo ""
        return
    fi
    # Diff all commits since last deploy against the last deployed commit
    git diff --name-only "${last_commit}" HEAD 2>/dev/null || echo ""
}

# =============================================================================
# Change Detection
# =============================================================================

detect_changes() {
    log_info "Detecting changes since last commit..." >&2

    local changed_files
    changed_files=$(get_changed_files)

    if [ -z "${changed_files}" ]; then
        log_info "No changes detected." >&2
        echo "none"
        return
    fi

    local frontend_changed=false
    local backend_changed=false

    for file in ${changed_files}; do
        case "${file}" in
            src/*|package.json)
                frontend_changed=true
                ;;
            server/*)
                backend_changed=true
                ;;
        esac
    done

    if [ "${frontend_changed}" = true ] && [ "${backend_changed}" = true ]; then
        echo "both"
    elif [ "${frontend_changed}" = true ]; then
        echo "frontend"
    elif [ "${backend_changed}" = true ]; then
        echo "backend"
    else
        echo "none"
    fi
}

# =============================================================================
# Database Operations
# =============================================================================

ensure_versions_table() {
    log_info "Ensuring deploy_versions table exists..."

    # Create table if not exists using sql.js (from server/node_modules)
    node -e "
const initSqlJs = require('${SCRIPT_DIR}/server/node_modules/sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = '${DB_PATH}';
if (!fs.existsSync(dbPath)) {
    console.log('Database does not exist yet. Skipping migration.');
    process.exit(0);
}

initSqlJs().then(SQL => {
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    db.run(\`
        CREATE TABLE IF NOT EXISTS deploy_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL,
            commit_hash TEXT NOT NULL,
            deployed_at TEXT DEFAULT CURRENT_TIMESTAMP,
            changes_summary TEXT,
            service TEXT NOT NULL
        )
    \`);

    const data = db.export();
    const fileBuffer = Buffer.from(data);
    fs.writeFileSync(dbPath, fileBuffer);
    console.log('deploy_versions table ready.');
    db.close();
}).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
" 2>&1 | tee -a "${LOG_FILE}"

    log_success "deploy_versions table ensured."
}

get_current_version() {
    # Use git tag as source of truth, fallback to server/package.json version
    local git_version
    git_version=$(git describe --tags 2>/dev/null | sed 's/^v//' || echo "")
    if [ -n "${git_version}" ]; then
        echo "${git_version}"
        return
    fi
    local pkg_version
    pkg_version=$(node -e "console.log(require('${SCRIPT_DIR}/server/package.json').version)")
    echo "${pkg_version}"
}

increment_version() {
    local current_version="$1"
    local increment_type="${2:-patch}"

    # Parse version (e.g., "1.0.0" -> major=1, minor=0, patch=0)
    local major minor patch
    IFS='.' read -r major minor patch <<< "${current_version}"

    case "${increment_type}" in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch|*)
            patch=$((patch + 1))
            ;;
    esac

    echo "${major}.${minor}.${patch}"
}

get_last_deployed_version() {
    local service="$1"

    node -e "
const initSqlJs = require('${SCRIPT_DIR}/server/node_modules/sql.js');
const fs = require('fs');

const dbPath = '${DB_PATH}';
if (!fs.existsSync(dbPath)) {
    console.log('');
    process.exit(0);
}

initSqlJs().then(SQL => {
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    const result = db.exec(\"SELECT version FROM deploy_versions WHERE service = '${service}' ORDER BY id DESC LIMIT 1\");
    if (result.length > 0 && result[0].values.length > 0) {
        console.log(result[0].values[0][0]);
    }
    db.close();
}).catch(err => {
    console.error('');
    process.exit(0);
});
" 2>&1
}

get_changes_summary() {
    # Returns pipe-separated commit messages since last deploy (max 10)
    local last_commit
    last_commit=$(get_last_deploy_commit)
    if [ -z "${last_commit}" ]; then
        git log --oneline HEAD~1..HEAD 2>/dev/null | head -1 || echo "No changes"
        return
    fi
    git log --oneline "${last_commit}..HEAD" 2>/dev/null | head -10 | tr '\n' '|' | sed 's/|/;;/g' | head -c 600
}

record_deployment() {
    local service="$1"
    local version="$2"
    local previous_version="$3"
    local commit_hash="$4"
    local changes_summary="$5"
    local changelog="$6"
    local api_url="${7:-http://localhost:3099/api/versions}"

    log_info "Recording deployment: ${service} v${version} (was v${previous_version})"

    # Escape all strings for JSON
    local escaped_summary escaped_changelog
    escaped_summary=$(printf '%s' "${changes_summary}" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))' 2>/dev/null || printf '%s' "${changes_summary}" | sed 's/"/\\"/g' | tr -d "'\''")
    escaped_changelog=$(printf '%s' "${changelog}" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))' 2>/dev/null || printf '%s' "${changelog}" | sed 's/"/\\"/g' | tr -d "'\''")

    local response
    response=$(curl -s -X POST "${api_url}" \
        -H "Content-Type: application/json" \
        -d "{\"version\":\"${version}\",\"previous_version\":\"${previous_version}\",\"commit_hash\":\"${commit_hash}\",\"changes_summary\":${escaped_summary},\"changelog\":${escaped_changelog},\"service\":\"${service}\"}" \
        2>&1) || true

    if echo "${response}" | grep -q '"success":true'; then
        log_success "Deployment recorded via API: ${service} v${version}"
    else
        log_warn "API recording failed, trying direct DB write..."
        # Fallback to direct DB write
        node -e "
const initSqlJs = require('${SCRIPT_DIR}/server/node_modules/sql.js');
const fs = require('fs');

const dbPath = '${DB_PATH}';
if (!fs.existsSync(dbPath)) {
    console.log('Database does not exist. Skipping record.');
    process.exit(0);
}

initSqlJs().then(SQL => {
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    db.run('INSERT INTO deploy_versions (version, previous_version, commit_hash, changes_summary, changelog, service) VALUES (?, ?, ?, ?, ?, ?)',
        ['${version}', '${previous_version}', '${commit_hash}', \`${changes_summary}\`, \`${changelog}\`, '${service}']);

    const data = db.export();
    const fileBuffer = Buffer.from(data);
    fs.writeFileSync(dbPath, fileBuffer);
    console.log('Deployment recorded via DB fallback.');
    db.close();
}).catch(err => {
    console.error('Error recording deployment:', err.message);
});
" 2>&1 | tee -a "${LOG_FILE}"
        log_success "Deployment recorded via DB fallback: ${service} v${version}"
    fi
}

# =============================================================================
# Build Operations
# =============================================================================

build_frontend() {
    log_info "Building frontend..."
    rm -rf "${SCRIPT_DIR}/dist" && npm run build 2>&1 | tee -a "${LOG_FILE}"

    # Sync built files to the docker-mounted nginx root.
    # The live frontend is served by the fidscript_whatsapp_frontend nginx container,
    # which bind-mounts this directory read-only into /usr/share/nginx/html.
    # (Do NOT use /var/www/whatsapp.nextmavens.cloud — that path is unused since the
    # host-nginx setup was replaced by the docker nginx container.)
    local nginx_root="/home/ken/fidscript-deploy/installer/docker/whatsapp-frontend.dist"
    log_info "Syncing dist/ to ${nginx_root}..."
    mkdir -p "${nginx_root}"
    rsync -a --delete "${SCRIPT_DIR}/dist/" "${nginx_root}/"
    log_success "Frontend synced to nginx root."

    # Reload nginx so any conf changes take effect (no-op if conf unchanged)
    if docker ps --format '{{.Names}}' | grep -q '^fidscript_whatsapp_frontend$'; then
        docker exec fidscript_whatsapp_frontend nginx -t 2>/dev/null \
            && docker exec fidscript_whatsapp_frontend nginx -s reload 2>/dev/null \
            && log_success "nginx reloaded." \
            || log_warn "nginx reload skipped (test failed or container unavailable)."
    fi
}

build_backend() {
    log_info "Building backend..."
    rm -rf "${SCRIPT_DIR}/server/dist"
    cd "${SCRIPT_DIR}/server" && npm run build 2>&1 | tee -a "${LOG_FILE}"
    log_success "Backend build completed."
}

restart_backend() {
    # Backend runs in Docker (container fidscript-whatsapp-api). /app/dist is baked
    # into the image, so we copy the freshly built dist into the running container,
    # then restart it to load the new code. The DB is bind-mounted separately.
    local container="fidscript-whatsapp-api"

    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        log_error "Backend container '${container}' is not running. Aborting backend restart."
        return 1
    fi

    log_info "Copying new dist into ${container}..."
    docker cp "${SCRIPT_DIR}/server/dist/." "${container}:/app/dist/" 2>&1 | tee -a "${LOG_FILE}"

    log_info "Restarting ${container}..."
    docker restart "${container}" 2>&1 | tee -a "${LOG_FILE}"
    sleep 2

    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        log_success "Backend container restarted."
    else
        log_error "Backend container failed to start after restart."
        return 1
    fi
}

# =============================================================================
# Main Deployment Logic
# =============================================================================

deploy() {
    local change_type="$1"
    local commit_hash
    commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

    log_info "Starting deployment - Change type: ${change_type}"

    case "${change_type}" in
        both)
            log_info "Changes detected in both frontend and backend."

            build_frontend
            build_backend
            restart_backend

            local frontend_version backend_version changes changelog previous_version
            previous_version=$(get_last_deployed_version "frontend")
            [ -z "${previous_version}" ] && previous_version="0.0.0"
            frontend_version=$(get_current_version)
            backend_version=$(get_current_version)
            changelog=$(get_changes_summary)
            changes=$(echo "${changelog}" | cut -d';' -f1 | sed 's/;;$//')

            record_deployment "frontend" "${frontend_version}" "${previous_version}" "${commit_hash}" "${changes}" "${changelog}"
            record_deployment "backend" "${backend_version}" "${previous_version}" "${commit_hash}" "${changes}" "${changelog}"
            ;;
        frontend)
            log_info "Changes detected in frontend only."

            build_frontend

            local frontend_version changes changelog previous_version
            previous_version=$(get_last_deployed_version "frontend")
            [ -z "${previous_version}" ] && previous_version="0.0.0"
            frontend_version=$(get_current_version)
            changelog=$(get_changes_summary)
            changes=$(echo "${changelog}" | cut -d';' -f1 | sed 's/;;$//')

            record_deployment "frontend" "${frontend_version}" "${previous_version}" "${commit_hash}" "${changes}" "${changelog}"
            ;;
        backend)
            log_info "Changes detected in backend only."

            build_backend
            restart_backend

            local backend_version changes changelog previous_version
            previous_version=$(get_last_deployed_version "backend")
            [ -z "${previous_version}" ] && previous_version="0.0.0"
            backend_version=$(get_current_version)
            changelog=$(get_changes_summary)
            changes=$(echo "${changelog}" | cut -d';' -f1 | sed 's/;;$//')

            record_deployment "backend" "${backend_version}" "${previous_version}" "${commit_hash}" "${changes}" "${changelog}"
            ;;
        none)
            log_info "No relevant changes detected — forcing clean rebuild to eliminate stale dist artifacts."

            build_frontend
            build_backend
            restart_backend

            local frontend_version backend_version changes changelog previous_version
            previous_version=$(get_last_deployed_version "frontend")
            [ -z "${previous_version}" ] && previous_version="0.0.0"
            frontend_version=$(get_current_version)
            backend_version=$(get_current_version)
            changelog=$(get_changes_summary)
            changes=$(echo "${changelog}" | cut -d';' -f1 | sed 's/;;$//')

            record_deployment "frontend" "${frontend_version}" "${previous_version}" "${commit_hash}" "${changes}" "${changelog}"
            record_deployment "backend" "${backend_version}" "${previous_version}" "${commit_hash}" "${changes}" "${changelog}"
            ;;
    esac

    log_success "Deployment completed successfully!"
    save_last_deploy_commit
}

# =============================================================================
# Main Entry Point
# =============================================================================

main() {
    echo "" >> "${LOG_FILE}"
    echo "========================================" >> "${LOG_FILE}"
    log_info "=== Starting FIDScript Deployment ==="
    log_info "=== Date: $(date '+%Y-%m-%d %H:%M:%S') ==="
    echo "========================================" >> "${LOG_FILE}"

    check_prerequisites
    git_pull
    ensure_versions_table

    local change_type
    change_type=$(detect_changes)

    deploy "${change_type}"

    log_info "Deployment finished at $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================" >> "${LOG_FILE}"
}

main "$@"
