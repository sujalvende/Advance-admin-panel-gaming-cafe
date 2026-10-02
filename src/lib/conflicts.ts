import type { Booking } from "./types";
import { addMinutesToTime, toMs } from "./time";

const OCCUPYING = ["pending", "confirmed", "delayed", "playing"];

export function span(b: { date: string; startTime: string; durationMin: number }) {
  const start = toMs(b.date, b.startTime);
  return [start, start + b.durationMin * 60000] as const;
}

export const endClock = (b: { startTime: string; durationMin: number }) =>
  addMinutesToTime(b.startTime, b.durationMin).time;

export function findConflicts(
  bookings: Booking[],
  probe: { id?: string; stationId: string; date: string; startTime: string; durationMin: number },
) {
  const [s, e] = span(probe);
  return bookings.filter((b) => {
    if (b.id === probe.id || b.deletedAt || b.stationId !== probe.stationId) return false;
    if (!OCCUPYING.includes(b.status) || b.sessionEndedAt) return false;
    const [bs, be] = span(b);
    return s < be && bs < e;
  });
}
