const DB_NAME = "attacker-2026-submission-files";
const STORE_NAME = "team-submission-files";
const DB_VERSION = 1;

import type { SubmissionRound } from "@/types/site";

export const MAX_ROUND2_SUBMISSION_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_ROUND3_SUBMISSION_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_SUBMISSION_FILE_BYTES = MAX_ROUND2_SUBMISSION_FILE_BYTES;

const allowedSubmissionExtensions = [".pdf"];
const allowedSubmissionMimeTypes = new Set([
  "application/pdf",
  "application/octet-stream",
]);

function getSubmissionExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index) : "";
}

export function isAllowedSubmissionFile(file: File) {
  const extension = getSubmissionExtension(file.name);
  const extensionAllowed = allowedSubmissionExtensions.includes(extension);
  const mimeAllowed = allowedSubmissionMimeTypes.has(file.type);

  if (!extensionAllowed) {
    return false;
  }

  if (file.type && !mimeAllowed) {
    return false;
  }

  return true;
}

export function getMaxSubmissionFileBytes(round: SubmissionRound) {
  return round === "round-3" ? MAX_ROUND3_SUBMISSION_FILE_BYTES : MAX_ROUND2_SUBMISSION_FILE_BYTES;
}

export function getSubmissionValidationError(file?: File | null, maxBytes = MAX_SUBMISSION_FILE_BYTES) {
  if (!file) {
    return "missing";
  }

  if (!isAllowedSubmissionFile(file)) {
    return "type";
  }

  if (file.size > maxBytes) {
    return "size";
  }

  return null;
}

function openSubmissionFileDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open file database."));
  });
}

export async function saveSubmissionFile(storageKey: string, file: File) {
  const database = await openSubmissionFileDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(file, storageKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Unable to save submission file."));
  });

  database.close();
}

export async function getSubmissionFile(storageKey: string) {
  const database = await openSubmissionFileDatabase();

  const result = await new Promise<Blob | undefined>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(storageKey);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to load submission file."));
  });

  database.close();
  return result;
}
