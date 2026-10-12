import { useEffect, useState, useSyncExternalStore } from "react";
import type { DbState } from "./types";
import { emptyState } from "./seed";

// Data layer. Swap `load`/`persist` for Supabase queries + realtime channels
// (see supabase/schema.sql). Other tabs are kept in sync via the `storage` event.
const KEY = "respawn.db.v2";

/** Ensure every payment record has the playerId field (v2 migration) and PS5 auto rate is 60. */
function migrateData(s: DbState): DbState {
  for (const b of s.bookings) {
    for (const p of b.payments) {
      if ((p as unknown as Record<string, unknown>).playerId === undefined) {
        p.playerId = null;
      }
    }
  }
  for (const r of s.rules) {
    if (r.stationType === "ps5" && r.rate === 300) {
      r.rate = 60;
    }
  }
  return s;
}

function load(): DbState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const migrated = migrateData(JSON.parse(raw) as DbState);
      try {
        localStorage.setItem(KEY, JSON.stringify(migrated));
      } catch {
        /* storage unavailable */
      }
      return migrated;
    }
  } catch {
    /* fall through to clean start */
  }
  const s = emptyState();
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
  return s;
}

let state: DbState = load();
for (const r of state.rules) {
  if (r.stationType === "ps5" && r.rate === 300) {
    r.rate = 60;
  }
}
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function setState(next: DbState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  emit();
}

export function mutate(fn: (draft: DbState) => void) {
  const draft = structuredClone(state);
  fn(draft);
  draft.version++;
  setState(draft);
}

export const getState = () => state;

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) {
      state = JSON.parse(e.newValue);
      emit();
    }
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useDb = () => useSyncExternalStore(subscribe, () => state);

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
