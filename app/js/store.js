// Vice Ledger — saved progress: localStorage, export to a file, import back.
// Everything lives in the reader's own browser; nothing is uploaded anywhere.

export const PROGRESS_KEY = 'vice-ledger-progress-v1';
export const SPOILER_KEY = 'vice-ledger-spoiler-v1';
export const EXPORT_VERSION = 1;

/** Load the earned trophy ids as a Set of numbers. Corrupt data falls back to empty. */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55));
  } catch {
    return new Set();
  }
}

/** Persist the earned trophy ids. */
export function saveProgress(earnedIds) {
  const ids = [...earnedIds].sort((a, b) => a - b);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(ids));
}

/** Load the spoiler setting (hide story trophies until earned). Default: off. */
export function loadSpoiler() {
  return localStorage.getItem(SPOILER_KEY) === '1';
}

/** Persist the spoiler setting. */
export function saveSpoiler(on) {
  localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
}

/** Build the export document for the current state. */
export function buildExport(earnedIds, spoilerOn) {
  return {
    app: 'vice-ledger',
    version: EXPORT_VERSION,
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earnedIds].sort((a, b) => a - b),
    spoilerFree: Boolean(spoilerOn),
  };
}

/**
 * Parse an imported export document. Returns { earned: Set, spoiler: boolean }.
 * Throws an Error with a plain message when the file is not a Vice Ledger export.
 */
export function parseImport(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!parsed || parsed.app !== 'vice-ledger' || !Array.isArray(parsed.earned)) {
    throw new Error('That file is not a Vice Ledger progress export.');
  }
  const earned = new Set(
    parsed.earned.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55),
  );
  return { earned, spoiler: parsed.spoilerFree === true };
}

/** Trigger a browser download of the given text as a file. */
export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
