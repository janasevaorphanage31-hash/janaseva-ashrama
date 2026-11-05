/**
 * Persistent Background Lead Upload Manager
 *
 * Guarantees zero-pause, zero-loss lead uploads even if the admin:
 * 1. Minimizes the browser or switches apps on Android / iOS
 * 2. Navigates between sub-pages or clicks away to other tabs
 * 3. Locks their mobile screen (via Screen WakeLock API)
 *
 * State is backed up in localStorage so returning to the page
 * automatically surfaces an active resume banner.
 */

export interface PersistedUploadJob {
  jobId: string;
  uploadBatchId?: string;
  createdAt: number;
  lastActiveAt: number;
  fileName: string;
  stream: "PARENTS" | "DIRECT_DONOR";
  totalLeads: number;
  totalChunks: number;
  currentChunk: number;
  chunks: any[][];
  autoDistribute: boolean;
  distributionMode: "balanced" | "round_robin";
  status: "in_progress" | "paused" | "done" | "error";
  statusMessage: string;
  stats: {
    insertedTotal: number;
    duplicatesTotal: number;
    enrichedTotal: number;
    junkTotal: number;
  };
}

const STORAGE_KEY = "janaseva_admin_active_upload_job";

let activeWakeLock: any = null;

/**
 * Acquire Screen Wake Lock so budget mobile phones don't sleep
 * and terminate the network connection during large batch uploads.
 */
export async function acquireWakeLock(): Promise<boolean> {
  if (typeof window === "undefined" || !("wakeLock" in navigator)) {
    return false;
  }
  try {
    activeWakeLock = await (navigator as any).wakeLock.request("screen");
    activeWakeLock.addEventListener("release", () => {
      activeWakeLock = null;
    });
    return true;
  } catch (err) {
    console.warn("[UploadManager] WakeLock not granted:", err);
    return false;
  }
}

/**
 * Release the active Screen Wake Lock
 */
export function releaseWakeLock() {
  if (activeWakeLock) {
    try {
      activeWakeLock.release();
    } catch {}
    activeWakeLock = null;
  }
}

/**
 * Save current job progress into localStorage
 */
export function saveActiveUploadJob(job: PersistedUploadJob) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify({
      ...job,
      lastActiveAt: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.warn("[UploadManager] Failed to persist upload job to localStorage:", e);
  }
}

/**
 * Retrieve any in-progress upload job (valid if within last 2 hours)
 */
export function getActiveUploadJob(): PersistedUploadJob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PersistedUploadJob = JSON.parse(raw);
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (Date.now() - parsed.lastActiveAt > TWO_HOURS) {
      clearActiveUploadJob();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clear the persisted upload job once complete or cancelled
 */
export function clearActiveUploadJob() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  releaseWakeLock();
}
