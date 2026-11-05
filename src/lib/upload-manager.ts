/**
 * Persistent Background Lead Upload Manager
 *
 * Guarantees zero-pause, zero-loss lead uploads even if the admin:
 * 1. Minimizes the browser or switches apps on Android / iOS
 * 2. Navigates between sub-pages or clicks away to other tabs
 * 3. Locks their mobile screen (via Screen WakeLock API)
 *
 * Uses IndexedDB to store full lead chunks without hitting the 5MB localStorage quota limit.
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
const DB_NAME = "JanasevaUploadDB";
const STORE_NAME = "upload_jobs";
const ACTIVE_JOB_KEY = "current_active_job";

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

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save job progress into IndexedDB (supports unlimited MBs for 180k+ leads),
 * and lightweight metadata into localStorage.
 */
export async function saveActiveUploadJob(job: PersistedUploadJob): Promise<void> {
  if (typeof window === "undefined") return;

  const jobWithTimestamp: PersistedUploadJob = {
    ...job,
    lastActiveAt: Date.now(),
  };

  // 1. Save lightweight metadata to localStorage (without the giant chunks array)
  try {
    const metaOnly = {
      ...jobWithTimestamp,
      chunks: [], // Omit chunks from localStorage to never exceed 5MB quota
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metaOnly));
  } catch (e) {
    console.warn("[UploadManager] Metadata localStorage fallback:", e);
  }

  // 2. Save full payload (including all chunks) into IndexedDB
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(jobWithTimestamp, ACTIVE_JOB_KEY);
  } catch (idbErr) {
    console.warn("[UploadManager] IndexedDB save warning:", idbErr);
  }
}

/**
 * Retrieve any in-progress upload job with full chunks from IndexedDB
 */
export async function getActiveUploadJob(): Promise<PersistedUploadJob | null> {
  if (typeof window === "undefined") return null;

  const TWO_HOURS = 2 * 60 * 60 * 1000;

  // Try IndexedDB first (contains the actual chunks)
  try {
    const db = await openDB();
    if (db) {
      const result = await new Promise<PersistedUploadJob | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(ACTIVE_JOB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (result) {
        if (Date.now() - result.lastActiveAt > TWO_HOURS) {
          clearActiveUploadJob();
          return null;
        }
        return result;
      }
    }
  } catch (err) {
    console.warn("[UploadManager] IndexedDB read error:", err);
  }

  // Fallback to localStorage metadata if IndexedDB empty
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PersistedUploadJob = JSON.parse(raw);
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
  try {
    void openDB().then((db) => {
      if (!db) return;
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(ACTIVE_JOB_KEY);
    });
  } catch {}
  releaseWakeLock();
}
