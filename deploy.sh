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
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] ${message}" | tee -a "${LOG_FILE}"
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

get_changed_files() {
    git diff --name-only HEAD~1 2>/dev/null || git diff --name-only HEAD^1 2>/dev/null || echo ""
}

# =============================================================================
# Change Detection
# =============================================================================

detect_changes() {
    log_info "Detecting changes since last commit..."

    local changed_files
    changed_files=$(get_changed_files)

    if [ -z "${changed_files}" ]; then
        log_info "No changes detected."
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

    # Create table if not exists using sql.js
    node -e "
const initSqlJs = require('sql.js');
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
    local pkg_version
    pkg_version=$(node -e "console.log(require('${SCRIPT_DIR}/package.json').version)")
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
const initSqlJs = require('sql.js');
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
    git diff --stat HEAD~1 2>/dev/null | head -20 || echo "No changes summary available"
}

record_deployment() {
    local service="$1"
    local version="$2"
    local commit_hash="$3"
    local changes_summary="$4"
    local api_url="${5:-http://localhost:3099/api/versions}"

    log_info "Recording deployment: ${service} v${version}"

    local response
    response=$(curl -s -X POST "${api_url}" \
        -H "Content-Type: application/json" \
        -d "{\"version\":\"${version}\",\"commit_hash\":\"${commit_hash}\",\"changes_summary\":\"${changes_summary}\",\"service\":\"${service}\"}" \
        2>&1) || true

    if echo "${response}" | grep -q '"success":true'; then
        log_success "Deployment recorded via API: ${service} v${version}"
    else
        log_warn "API recording failed, trying direct DB write..."
        # Fallback to direct DB write
        node -e "
const initSqlJs = require('sql.js');
const fs = require('fs');

const dbPath = '${DB_PATH}';
if (!fs.existsSync(dbPath)) {
    console.log('Database does not exist. Skipping record.');
    process.exit(0);
}

initSqlJs().then(SQL => {
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    db.run(\`
        INSERT INTO deploy_versions (version, commit_hash, changes_summary, service)
        VALUES (?, ?, ?, ?)
    \`, ['${version}', '${commit_hash}', '${changes_summary}', '${service}']);

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
    npm run build 2>&1 | tee -a "${LOG_FILE}"
    log_success "Frontend build completed."
}

build_backend() {
    log_info "Building backend..."
    cd "${SCRIPT_DIR}/server" && npm run build 2>&1 | tee -a "${LOG_FILE}"
    log_success "Backend build completed."
}

restart_backend() {
    log_info "Restarting backend service via PM2..."

    if command -v pm2 >/dev/null 2>&1; then
        pm2 restart fidscript-api 2>&1 | tee -a "${LOG_FILE}"
        log_success "Backend service restarted."
    else
        log_warn "PM2 not found. Backend restart skipped."
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

            local frontend_version
            frontend_version=$(get_current_version)
            local backend_version
            backend_version=$(get_current_version)

            # Record both deployments
            record_deployment "frontend" "${frontend_version}" "${commit_hash}" "$(get_changes_summary)"
            record_deployment "backend" "${backend_version}" "${commit_hash}" "$(get_changes_summary)"
            ;;
        frontend)
            log_info "Changes detected in frontend only."

            build_frontend

            local frontend_version
            frontend_version=$(get_current_version)

            record_deployment "frontend" "${frontend_version}" "${commit_hash}" "$(get_changes_summary)"
            ;;
        backend)
            log_info "Changes detected in backend only."

            build_backend
            restart_backend

            local backend_version
            backend_version=$(get_current_version)

            record_deployment "backend" "${backend_version}" "${commit_hash}" "$(get_changes_summary)"
            ;;
        none)
            log_info "No relevant changes detected. Skipping build."
            log_success "Deployment check completed - no rebuild needed."
            return 0
            ;;
    esac

    log_success "Deployment completed successfully!"
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
