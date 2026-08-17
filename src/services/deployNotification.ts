const VERSION_KEY = 'fidscript_version';
const DISMISS_KEY = 'fidscript_version_dismissed';
const POLL_INTERVAL = 30_000;        // poll every 30s - quick enough for deploy awareness
const DISMISS_DURATION = 30 * 60_000; // 30 minutes

export interface VersionInfo {
  version: string;
  previous_version: string | null;
  commit_hash: string;
  deployed_at: string;
  changes_summary: string;
  changelog: string | null;
}

let currentVersion: VersionInfo | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let listeners: ((info: VersionInfo | null) => void)[] = [];

function getStoredVersion(): string | null {
  return localStorage.getItem(VERSION_KEY);
}

function setStoredVersion(v: string): void {
  localStorage.setItem(VERSION_KEY, v);
}

function getDismissedUntil(): number {
  const val = localStorage.getItem(DISMISS_KEY);
  if (!val) return 0;
  const ts = parseInt(val, 10);
  return isNaN(ts) ? 0 : ts;
}

function isDismissed(): boolean {
  return Date.now() < getDismissedUntil();
}

function dismiss(): void {
  localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION));
}

function compareVersions(local: string, remote: string): boolean {
  if (local === remote) return false;
  const lp = local.split('.').map(Number);
  const rp = remote.split('.').map(Number);
  for (let i = 0; i < Math.max(lp.length, rp.length); i++) {
    const l = lp[i] ?? 0;
    const r = rp[i] ?? 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

async function fetchVersion(): Promise<VersionInfo | null> {
  try {
    const res = await fetch('/api/versions/latest');
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as VersionInfo) : null;
  } catch {
    return null;
  }
}

/** Returns the VersionInfo when a new version is available, null otherwise */
export async function checkForUpdate(): Promise<VersionInfo | null> {
  if (!currentVersion) return null;
  const local = getStoredVersion();
  if (!local) return null;
  if (!compareVersions(local, currentVersion.version)) return null;
  if (isDismissed()) return null;
  return currentVersion;
}

export function dismissUpdate(): void {
  dismiss();
  listeners.forEach((l) => l(null));
}

/** Listen for new-version events. Pass null to clear the notification. */
export function onUpdateChange(listener: (info: VersionInfo | null) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export async function initDeployNotification(): Promise<void> {
  const remote = await fetchVersion();
  if (!remote) return;

  currentVersion = remote;
  const local = getStoredVersion();

  if (!local) {
    setStoredVersion(remote.version);
    return;
  }

  if (compareVersions(local, remote.version) && !isDismissed()) {
    listeners.forEach((l) => l(remote));
  }

  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    const latest = await fetchVersion();
    if (!latest) return;

    const hadOld = currentVersion?.version;
    currentVersion = latest;
    const stored = getStoredVersion();

    if (stored && compareVersions(stored, latest.version) && !isDismissed()) {
      listeners.forEach((l) => l(latest));
    }
  }, POLL_INTERVAL);
}

export function getCurrentVersion(): VersionInfo | null {
  return currentVersion;
}
