import type { Booking, DbState } from "./types";
import { bookingTotals, type Totals } from "./pricing";
import { addDays, startOfWeek, todayStr } from "./time";

export interface Row {
  b: Booking;
  t: Totals;
  stationName: string;
  gameTitle: string;
}

export const toRows = (s: DbState, now = Date.now()): Row[] =>
  s.bookings
    .filter((b) => !b.deletedAt)
    .map((b) => ({
      b,
      t: bookingTotals(b, s.rules, s.stations, now),
      stationName: s.stations.find((x) => x.id === b.stationId)?.name.replace(" · ", " ") ?? "—",
      gameTitle: s.games.find((g) => g.id === b.gameId)?.title ?? "Not decided",
    }));

export interface Summary {
  bookings: number; completed: number; noShows: number; players: number;
  minutes: number; revenue: number; online: number; cash: number;
}

export function summarize(rows: Row[]): Summary {
  const done = rows.filter((r) => r.b.status === "completed");
  return {
    bookings: rows.length,
    completed: done.length,
    noShows: rows.filter((r) => r.b.status === "noshow").length,
    players: done.reduce((s, r) => s + r.b.players.length, 0),
    minutes: done.reduce((s, r) => s + r.t.playerMinutes, 0),
    revenue: done.reduce((s, r) => s + r.t.paid, 0),
    online: done.reduce((s, r) => s + r.t.online, 0),
    cash: done.reduce((s, r) => s + r.t.offline, 0),
  };
}

export const periodRows = (rows: Row[], from: string, to: string) =>
  rows.filter((r) => r.b.date >= from && r.b.date <= to);

export function presets() {
  const t = todayStr();
  return {
    today: [t, t],
    yesterday: [addDays(t, -1), addDays(t, -1)],
    week: [startOfWeek(t), t],
    month: [`${t.slice(0, 8)}01`, t],
  } as Record<string, [string, string]>;
}

export const csvEscape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
