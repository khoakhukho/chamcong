/**
 * IndexedDB Offline Attendance Storage & Sync Manager
 * Supports recording punches without internet and automatically syncing when online.
 */

const DB_NAME = 'CaritasChamCongDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_attendances';

export interface OfflineAttendanceRecord {
  id?: number;
  userId: number;
  employeeCode: string;
  checkType: 'IN' | 'OUT';
  imageData: string;
  latitude: number | null;
  longitude: number | null;
  locationAddress?: string | null;
  capturedAt: string; // ISO String at the moment of taking photo
  notes?: string | null;
  status: 'PENDING_SYNC' | 'SYNCING' | 'FAILED';
  createdAt: number;
  error?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an attendance record to IndexedDB when device is offline
 */
export async function saveOfflineAttendance(
  record: Omit<OfflineAttendanceRecord, 'id' | 'status' | 'createdAt'>
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const data: OfflineAttendanceRecord = {
      ...record,
      status: 'PENDING_SYNC',
      createdAt: Date.now(),
    };

    const request = store.add(data);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending offline attendance records
 */
export async function getPendingOfflineAttendances(): Promise<OfflineAttendanceRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as OfflineAttendanceRecord[]) || [];
        resolve(results.filter((r) => r.status === 'PENDING_SYNC' || r.status === 'FAILED'));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Remove record after successful synchronization
 */
export async function removeOfflineAttendance(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark a record status
 */
export async function updateOfflineAttendanceStatus(
  id: number,
  status: 'PENDING_SYNC' | 'SYNCING' | 'FAILED',
  error?: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result as OfflineAttendanceRecord;
      if (record) {
        record.status = status;
        if (error) record.error = error;
        store.put(record);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Trigger synchronization of all pending offline records to server
 */
export async function syncAllOfflineAttendances(
  onProgress?: (syncedCount: number, totalCount: number) => void
): Promise<{ successCount: number; failCount: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { successCount: 0, failCount: 0 };
  }

  const pending = await getPendingOfflineAttendances();
  if (pending.length === 0) {
    return { successCount: 0, failCount: 0 };
  }

  let successCount = 0;
  let failCount = 0;

  for (const record of pending) {
    if (!record.id) continue;

    try {
      await updateOfflineAttendanceStatus(record.id, 'SYNCING');

      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkType: record.checkType,
          imageData: record.imageData,
          latitude: record.latitude,
          longitude: record.longitude,
          locationAddress: record.locationAddress,
          clientCapturedTime: record.capturedAt,
          isOfflineSync: true,
          notes: record.notes,
        }),
      });

      if (response.ok) {
        await removeOfflineAttendance(record.id);
        successCount++;
      } else {
        const errData = await response.json().catch(() => ({}));
        await updateOfflineAttendanceStatus(record.id, 'FAILED', errData.error || 'Server error');
        failCount++;
      }
    } catch (err: any) {
      await updateOfflineAttendanceStatus(record.id, 'FAILED', err.message);
      failCount++;
    }

    if (onProgress) {
      onProgress(successCount + failCount, pending.length);
    }
  }

  return { successCount, failCount };
}
