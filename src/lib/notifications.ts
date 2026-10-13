/**
 * Notification system for Gaming Café session alerts.
 *
 * Architecture:
 * - Notification records stored in localStorage under `respawn.notifications.v1`
 * - Settings stored under `respawn.notif-settings.v1`
 * - A singleton `notifBus` emits to all React subscribers
 * - Duplicate prevention via a fired-keys Set (cleared on page reload — intentional)
 */

import { useEffect, useState, useSyncExternalStore } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifLevel = "info" | "warning" | "critical";

export interface Notification {
  id: string;
  bookingId: string;
  /** Unique key used for dedup — e.g. `${bookingId}-${playerId}-overtime` */
  dedupKey: string;
  level: NotifLevel;
  title: string;
  body: string;
  /** ISO timestamp when the notification was generated */
  createdAt: string;
  read: boolean;
}

export interface NotifSettings {
  /** Enable in-app notifications */
  inApp: boolean;
  /** Enable browser desktop notifications */
  desktop: boolean;
  /** Enable sound alerts */
  sound: boolean;
  /** Play a 1-minute advance warning */
  warnOneMin: boolean;
  /** Volume 0–1 */
  volume: number;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const NOTIFS_KEY = "respawn.notifications.v1";
const SETTINGS_KEY = "respawn.notif-settings.v1";
const MAX_STORED = 150;

// ─── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: NotifSettings = {
  inApp: true,
  desktop: false,
  sound: true,
  warnOneMin: true,
  volume: 0.6,
};

function loadSettings(): NotifSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NotifSettings> & { warnFiveMin?: boolean };
      // Migrate old warnFiveMin key to warnOneMin
      if (parsed.warnFiveMin !== undefined && parsed.warnOneMin === undefined) {
        parsed.warnOneMin = parsed.warnFiveMin;
        delete parsed.warnFiveMin;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: NotifSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* */ }
  settingsListeners.forEach((l) => l());
}

let _settings = loadSettings();
const settingsListeners = new Set<() => void>();

export function getSettings() { return _settings; }

window.addEventListener("storage", (e) => {
  if (e.key === SETTINGS_KEY && e.newValue) {
    _settings = { ...DEFAULT_SETTINGS, ...(JSON.parse(e.newValue) as Partial<NotifSettings>) };
    settingsListeners.forEach((l) => l());
  }
});

export function useNotifSettings(): [NotifSettings, (s: NotifSettings) => void] {
  const s = useSyncExternalStore(
    (l) => { settingsListeners.add(l); return () => settingsListeners.delete(l); },
    getSettings,
  );
  return [s, (next) => { _settings = next; saveSettings(next); }];
}

// ─── Notification store ────────────────────────────────────────────────────────

function loadNotifs(): Notification[] {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (raw) return JSON.parse(raw) as Notification[];
  } catch { /* */ }
  return [];
}

function persistNotifs(list: Notification[]) {
  try { localStorage.setItem(NOTIFS_KEY, JSON.stringify(list.slice(-MAX_STORED))); } catch { /* */ }
}

let _notifs: Notification[] = loadNotifs();
const notifListeners = new Set<() => void>();
const emitNotifs = () => notifListeners.forEach((l) => l());

/** Keys already fired this page load — prevents repeated triggers from polling. */
const _firedKeys = new Set<string>();

export function getNotifs() { return _notifs; }
export function getUnreadCount() { return _notifs.filter((n) => !n.read).length; }

export function addNotification(n: Omit<Notification, "id" | "createdAt" | "read">) {
  if (_firedKeys.has(n.dedupKey)) return; // already fired this session
  _firedKeys.add(n.dedupKey);

  const notif: Notification = {
    ...n,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  _notifs = [notif, ..._notifs].slice(0, MAX_STORED);
  persistNotifs(_notifs);
  emitNotifs();

  const settings = getSettings();

  // Desktop notification
  if (settings.desktop && Notification.permission === "granted") {
    try {
      new Notification(notif.title, {
        body: notif.body,
        icon: "/favicon.ico",
        tag: notif.dedupKey,
      });
    } catch { /* */ }
  }

  // Sound alert
  if (settings.sound) {
    playAlertSound(settings.volume);
  }
}

export function markAllRead() {
  _notifs = _notifs.map((n) => ({ ...n, read: true }));
  persistNotifs(_notifs);
  emitNotifs();
}

export function markRead(id: string) {
  _notifs = _notifs.map((n) => n.id === id ? { ...n, read: true } : n);
  persistNotifs(_notifs);
  emitNotifs();
}

export function clearAll() {
  _notifs = [];
  _firedKeys.clear();
  try { localStorage.removeItem(NOTIFS_KEY); } catch { /* */ }
  emitNotifs();
}

// Cross-tab sync
window.addEventListener("storage", (e) => {
  if (e.key === NOTIFS_KEY && e.newValue) {
    _notifs = JSON.parse(e.newValue) as Notification[];
    emitNotifs();
  }
});

// ─── React hooks ──────────────────────────────────────────────────────────────

export function useNotifications() {
  return useSyncExternalStore(
    (l) => { notifListeners.add(l); return () => notifListeners.delete(l); },
    getNotifs,
  );
}

export function useUnreadCount() {
  const notifs = useNotifications();
  return notifs.filter((n) => !n.read).length;
}

// ─── Sound ────────────────────────────────────────────────────────────────────

/** Synthesize a brief alert tone using the Web Audio API */
export function playAlertSound(volume = 0.6) {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), ctx.currentTime);
    gain.connect(ctx.destination);

    // Two-tone chime: 880 Hz → 660 Hz
    const tones = [880, 660];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.16);
    });

    // Fade out
    gain.gain.setValueAtTime(volume, ctx.currentTime + 0.30);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.55);

    setTimeout(() => ctx.close(), 700);
  } catch { /* AudioContext may be blocked */ }
}

// ─── Session expiry detection helpers ─────────────────────────────────────────

/**
 * Returns the planned end timestamp (ms) for a running booking session,
 * based on `sessionStartedAt` + `durationMin`, adjusted for paused time.
 */
export function plannedEndMs(
  sessionStartedAt: string,
  durationMin: number,
  pausedMs: number,
): number {
  return Date.parse(sessionStartedAt) + durationMin * 60_000 + pausedMs;
}

/**
 * Hook: fires a React effect that polls active bookings every 10 s and
 * generates notifications when:
 *  - A booking's planned time has expired  (dedupKey: `{id}-overtime`)
 *  - A booking has 5 min remaining (if warnFiveMin setting is on)
 *    (dedupKey: `{id}-warn5`)
 */
export function useSessionExpiryWatcher(
  bookings: Array<{
    id: string;
    customerName: string;
    sessionStartedAt: string | null;
    sessionEndedAt: string | null;
    pausedAt: string | null;
    pausedMs: number;
    durationMin: number;
    players: Array<{ name: string }>;
    stationId: string;
  }>,
  stations: Array<{ id: string; name: string }>,
) {
  useEffect(() => {
    function check() {
      const now = Date.now();
      const settings = getSettings();
      if (!settings.inApp) return;

      for (const b of bookings) {
        // Only active (running, not paused, not ended)
        if (!b.sessionStartedAt || b.sessionEndedAt || b.pausedAt) continue;

        const stationName = stations.find((s) => s.id === b.stationId)?.name ?? "Unknown Station";
        const endMs = plannedEndMs(b.sessionStartedAt, b.durationMin, b.pausedMs);
        const msLeft = endMs - now;

        // 1-minute warning
        if (settings.warnOneMin && msLeft > 0 && msLeft <= 60_000) {
          const secsLeft = Math.ceil(msLeft / 1_000);
          addNotification({
            bookingId: b.id,
            dedupKey: `${b.id}-warn1`,
            level: "warning",
            title: "1 Minute Remaining",
            body: `${b.customerName}'s session at ${stationName} ends in ~${secsLeft}s.`,
          });
        }

        // Time expired
        if (msLeft <= 0) {
          addNotification({
            bookingId: b.id,
            dedupKey: `${b.id}-overtime`,
            level: "critical",
            title: "Session Time Over",
            body: `${b.customerName}'s session at ${stationName} has reached its allotted time.`,
          });
        }
      }
    }

    check(); // run immediately
    const timer = setInterval(check, 10_000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, stations]);
}
