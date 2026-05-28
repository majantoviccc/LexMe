import type { AppState } from "./types";

const STORAGE_KEY = "lexme.state.v1";
const SAVE_DELAY_MS = 400;

export const emptyState: AppState = {
  projects: [],
  threads: [],
  messages: [],
  activeThreadId: null,
  activeProjectId: null,
};

export function loadState(): AppState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      threads: Array.isArray(parsed.threads) ? parsed.threads : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      activeThreadId:
        typeof parsed.activeThreadId === "string" ? parsed.activeThreadId : null,
      activeProjectId:
        typeof parsed.activeProjectId === "string"
          ? parsed.activeProjectId
          : null,
    };
  } catch {
    return emptyState;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pending: AppState | null = null;

function flush(): void {
  if (!pending) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    /* quota / serialization errors are non-fatal */
  }
  pending = null;
}

export function saveStateDebounced(state: AppState): void {
  if (typeof window === "undefined") return;
  pending = state;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    flush();
  }, SAVE_DELAY_MS);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    flush();
  });
}
