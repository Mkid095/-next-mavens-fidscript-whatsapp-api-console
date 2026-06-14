#!/bin/bash
# =============================================================================
# FIDScript WhatsApp - Server-Only Deployment Script
# =============================================================================
# Can be called by the main deploy script or run independently for server-only
# deployments without rebuilding the frontend
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/../deploy.log"
DB_PATH="${SCRIPT_DIR}/fidscript.db"

# =============================================================================
# Logging Functions
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] [SERVER] ${message}" | tee -a "${LOG_FILE}"
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

    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm command not found. Aborting."
        exit 1
    fi

    log_info "Prerequisites check passed."
}

# =============================================================================
# Database Operations
# =============================================================================

ensure_versions_table() {
    log_info "Ensuring deploy_versions table exists..."

    node -e "
const initSqlJs = require('sql.js');
const fs = require('fs');

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

get_last_deployed_version() {
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

    const result = db.exec(\"SELECT version FROM deploy_versions WHERE service = 'backend' ORDER BY id DESC LIMIT 1\");
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

record_deployment() {
    local version="$1"
    local commit_hash="$2"
    local changes_summary="$3"

    log_info "Recording deployment: backend v${version}"

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
    \`, ['${version}', '${commit_hash}', '${changes_summary}', 'backend']);

    const data = db.export();
    const fileBuffer = Buffer.from(data);
    fs.writeFileSync(dbPath, fileBuffer);
    console.log('Deployment recorded successfully.');
    db.close();
}).catch(err => {
    console.error('Error recording deployment:', err.message);
    process.exit(1);
});
" 2>&1 | tee -a "${LOG_FILE}"

    log_success "Deployment recorded: backend v${version}"
}

# =============================================================================
# Build Operations
# =============================================================================

build_backend() {
    log_info "Building backend..."
    npm run build 2>&1 | tee -a "${LOG_FILE}"
    log_success "Backend build completed."
}

restart_backend() {
    log_info "Restarting backend service via PM2..."

    if command -v pm2 >/dev/null 2>&1; then
        pm2 restart fidscript-api 2>&1 | tee -a "${LOG_FILE}"
        log_success "Backend service restarted."
    else
        log_warn "PM2 not found. Attempting alternative restart..."
        if [ -f "${SCRIPT_DIR}/ecosystem.config.cjs" ]; then
            pm2 start "${SCRIPT_DIR}/ecosystem.config.cjs" 2>&1 | tee -a "${LOG_FILE}"
            log_success "Backend service started via ecosystem config."
        else
            log_error "PM2 and ecosystem config not found. Cannot restart."
            exit 1
        fi
    fi
}

# =============================================================================
# Main Entry Point
# =============================================================================

main() {
    local skip_build="${1:-false}"

    echo "" >> "${LOG_FILE}"
    echo "----------------------------------------" >> "${LOG_FILE}"
    log_info "=== Starting Server-Only Deployment ==="
    log_info "=== Date: $(date '+%Y-%m-%d %H:%M:%S') ==="
    echo "----------------------------------------" >> "${LOG_FILE}"

    check_prerequisites
    ensure_versions_table

    if [ "${skip_build}" = "true" ]; then
        log_info "Skipping build (--skip-build flag set)"
    else
        build_backend
    fi

    restart_backend

    local commit_hash
    commit_hash=$(cd "${SCRIPT_DIR}/.." && git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    local version
    version=$(get_current_version)

    record_deployment "${version}" "${commit_hash}" "Server-only deployment"

    log_info "Server deployment finished at $(date '+%Y-%m-%d %H:%M:%S')"
    echo "----------------------------------------" >> "${LOG_FILE}"
}

main "$@"
