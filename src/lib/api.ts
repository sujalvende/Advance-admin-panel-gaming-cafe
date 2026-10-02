import type {
  Booking,
  BookingSource,
  BookingStatus,
  DbState,
  PayType,
  Player,
  PricingRule,
  StationStatus,
} from "./types";
import { getState, mutate, setState } from "./store";
import { findConflicts } from "./conflicts";
import { bookingTotals, calcAmount, playerMinutes, ruleFor } from "./pricing";
import { emptyState, seedState, uid } from "./seed";
import { toMs, todayStr } from "./time";

export class ApiError extends Error {}

const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const fail = (msg: string): never => {
  throw new ApiError(msg);
};

async function run<T>(fn: () => T): Promise<T> {
  await wait();
  return fn();
}

const find = (s: DbState, id: string) => {
  const b = s.bookings.find((x) => x.id === id);
  return b ?? fail("That booking no longer exists.");
};

const newPlayer = (name: string, b?: Booking): Player => ({
  id: uid(),
  name,
  startTime: b?.sessionStartedAt && !b.sessionEndedAt ? new Date().toISOString() : null,
  endTime: null,
  plannedMinutes: null,
  rate: null,
  amount: null,
  overridden: false,
  paymentStatus: "unpaid",
  paymentMethod: null,
  notes: "",
});

export interface BookingInput {
  customerName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  date: string;
  startTime: string;
  durationMin: number;
  stationId: string;
  gameId: string;
  playerCount: number;
  notes?: string;
  source: BookingSource;
  status?: BookingStatus;
}

function validateInput(s: DbState, i: BookingInput, id?: string, allowConflict = false) {
  const name = i.customerName.trim().slice(0, 80);
  if (!name) fail("Please enter a name.");
  const phone = i.phone.replace(/[^\d+]/g, "");
  if (phone.replace(/\D/g, "").length < 7) fail("Please enter a valid phone number.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date) || !/^\d{2}:\d{2}$/.test(i.startTime))
    fail("Please choose a valid date and time.");
  if (!(i.durationMin >= 10 && i.durationMin <= 720)) fail("Duration must be between 10 minutes and 12 hours.");
  if (!(i.playerCount >= 1 && i.playerCount <= 12)) fail("Players must be between 1 and 12.");
  const station = s.stations.find((x) => x.id === i.stationId) ?? fail("Please choose a station.");
  if (station.type === "vr") fail("VR is coming soon and can't be booked yet.");
  if (!allowConflict) {
    const c = findConflicts(s.bookings, { ...i, id });
    if (c.length) fail(`Station conflict with #${c[0].no} (${c[0].customerName}).`);
  }
  return { name, phone };
}

export const api = {
  createBooking: (i: BookingInput, opts: { allowConflict?: boolean } = {}) =>
    run(() => {
      const s0 = getState();
      const { name, phone } = validateInput(s0, i, undefined, opts.allowConflict);
      if (i.source === "website" && toMs(i.date, i.startTime) < Date.now() - 5 * 60000)
        fail("That start time has already passed.");
      let created!: Booking;
      mutate((s) => {
        const now = new Date().toISOString();
        const players = Array.from({ length: i.playerCount }, (_, k) =>
          newPlayer(k === 0 ? name : `Player ${k + 1}`),
        );
        created = {
          id: uid(), no: s.seq++, customerName: name, phone,
          whatsapp: (i.whatsapp ?? "").trim(), email: (i.email ?? "").trim(),
          date: i.date, startTime: i.startTime, durationMin: i.durationMin,
          stationId: i.stationId, gameId: i.gameId, status: i.status ?? "pending", source: i.source,
          notes: (i.notes ?? "").trim().slice(0, 500), players, payments: [],
          sessionStartedAt: null, pausedAt: null, pausedMs: 0, sessionEndedAt: null, refunded: false,
          createdAt: now, updatedAt: now, completedAt: null, deletedAt: null, finalTotal: null,
        };
        s.bookings.push(created);
      });
      return created;
    }),

  updateBooking: (id: string, i: BookingInput & { status: BookingStatus }, opts: { allowConflict?: boolean } = {}) =>
    run(() => {
      const s0 = getState();
      const b0 = find(s0, id);
      if (b0.status === "completed") fail("Completed sessions are locked.");
      const { name, phone } = validateInput(s0, i, id, opts.allowConflict);
      mutate((s) => {
        const b = find(s, id);
        Object.assign(b, {
          customerName: name, phone, whatsapp: (i.whatsapp ?? "").trim(), email: (i.email ?? "").trim(),
          date: i.date, startTime: i.startTime, durationMin: i.durationMin,
          stationId: i.stationId, gameId: i.gameId, source: i.source, status: i.status,
          notes: (i.notes ?? "").trim().slice(0, 500), updatedAt: new Date().toISOString(),
        });
        while (b.players.length < i.playerCount) b.players.push(newPlayer(`Player ${b.players.length + 1}`, b));
        if (b.players.length > i.playerCount) b.players.length = i.playerCount;
      });
    }),

  setStatus: (id: string, status: BookingStatus) =>
    run(() => {
      mutate((s) => {
        const b = find(s, id);
        if (b.status === "completed") fail("Completed sessions are locked.");
        b.status = status;
        b.updatedAt = new Date().toISOString();
        if (["noshow", "cancelled"].includes(status)) {
          const st = s.stations.find((x) => x.id === b.stationId);
          if (st?.status === "booked" && !s.bookings.some((o) => o.id !== b.id && o.stationId === st.id && o.status === "playing")) st.status = "available";
        }
      });
    }),

  archive: (id: string) =>
    run(() =>
      mutate((s) => {
        const b = find(s, id);
        if (b.status === "playing" && !b.sessionEndedAt) fail("End the running session before deleting.");
        b.deletedAt = new Date().toISOString();
      }),
    ),

  restore: (id: string) =>
    run(() =>
      mutate((s) => {
        find(s, id).deletedAt = null;
      }),
    ),

  startSession: (id: string) =>
    run(() =>
      mutate((s) => {
        const b = find(s, id);
        if (!["pending", "confirmed", "delayed"].includes(b.status)) fail("This booking can't be started.");
        const busy = s.bookings.find((o) => o.id !== id && o.stationId === b.stationId && o.status === "playing" && !o.sessionEndedAt);
        if (busy) fail(`Station is in use by #${busy.no}.`);
        const st = s.stations.find((x) => x.id === b.stationId);
        if (st && ["maintenance", "disabled"].includes(st.status)) fail("This station is not in service.");
        const now = new Date().toISOString();
        b.status = "playing";
        b.sessionStartedAt = now;
        b.pausedAt = null;
        b.pausedMs = 0;
        b.players.forEach((p) => { if (!p.startTime) p.startTime = now; });
        if (st) st.status = "playing";
      }),
    ),

  pauseSession: (id: string) =>
    run(() => mutate((s) => { const b = find(s, id); if (!b.pausedAt) b.pausedAt = new Date().toISOString(); })),

  resumeSession: (id: string) =>
    run(() =>
      mutate((s) => {
        const b = find(s, id);
        if (!b.pausedAt) return;
        const gap = Date.now() - Date.parse(b.pausedAt);
        b.pausedMs += gap;
        b.players.forEach((p) => {
          if (p.startTime && !p.endTime) p.startTime = new Date(Date.parse(p.startTime) + gap).toISOString();
        });
        b.pausedAt = null;
      }),
    ),

  /** Stops the clock for every running player, freezes amounts and frees the station. */
  endSession: (id: string) =>
    run(() =>
      mutate((s) => {
        const b = find(s, id);
        if (b.status !== "playing") fail("This session isn't running.");
        const now = new Date().toISOString();
        const ref = b.pausedAt ?? now;
        const type = s.stations.find((x) => x.id === b.stationId)?.type ?? "ps5";
        const rule = ruleFor(s.rules, type);
        b.players.forEach((p) => {
          if (!p.endTime) p.endTime = ref;
          if (!p.startTime) p.startTime = ref;
        });
        b.pausedAt = null;
        b.sessionEndedAt = now;
        b.players.forEach((p) => {
          if (!p.overridden) {
            p.amount = calcAmount(playerMinutes(b, p, Date.now()), rule, b.players.length);
          }
          p.rate = rule?.rate ?? 0;
        });
        const st = s.stations.find((x) => x.id === b.stationId);
        if (st?.status === "playing") st.status = "available";
      }),
    ),

  endPlayer: (id: string, playerId: string) =>
    run(() =>
      mutate((s) => {
        const b = find(s, id);
        const p = b.players.find((x) => x.id === playerId) ?? fail("Player not found.");
        p.endTime = b.pausedAt ?? new Date().toISOString();
        if (!p.startTime) p.startTime = p.endTime;
        if (!p.overridden) {
          const type = s.stations.find((x) => x.id === b.stationId)?.type ?? "ps5";
          p.amount = calcAmount(playerMinutes(b, p, Date.now()), ruleFor(s.rules, type), b.players.length);
        }
      }),
    ),

  addPlayer: (id: string, name: string) =>
    run(() =>
      mutate((s) => {
        const b = find(s, id);
        if (b.status === "completed" || b.sessionEndedAt) fail("This session is already closed.");
        if (b.players.length >= 12) fail("Maximum 12 players per booking.");
        b.players.push(newPlayer(name.trim() || `Player ${b.players.length + 1}`, b));
      }),
    ),

  updatePlayer: (id: string, playerId: string, patch: Partial<Player> & { amountInput?: number | null }) =>
    run(() =>
      mutate((s) => {
        const b = find(s, id);
        if (b.status === "completed") fail("Completed sessions are locked.");
        const p = b.players.find((x) => x.id === playerId) ?? fail("Player not found.");
        const { amountInput, ...rest } = patch;
        Object.assign(p, rest);
        if (p.startTime && p.endTime && Date.parse(p.endTime) <= Date.parse(p.startTime))
          fail("End time must be after start time.");
        if (amountInput !== undefined) {
          if (amountInput != null && (!Number.isFinite(amountInput) || amountInput < 0)) fail("Amount can't be negative.");
          p.overridden = amountInput != null;
          p.amount = amountInput;
        }
        if (!p.overridden) {
          const type = s.stations.find((x) => x.id === b.stationId)?.type ?? "ps5";
          p.amount = p.endTime
            ? calcAmount(playerMinutes(b, p, Date.now()), ruleFor(s.rules, type), b.players.length)
            : null;
        }
      }),
    ),

  removePlayer: (id: string, playerId: string) =>
    run(() =>
      mutate((s) => {
        const b = find(s, id);
        if (b.status === "completed") fail("Completed sessions are locked.");
        if (b.players.length <= 1) fail("A booking needs at least one player.");
        b.players = b.players.filter((p) => p.id !== playerId);
      }),
    ),

  addPayment: (id: string, input: { online: number; offline: number; reference: string; notes: string }) =>
    run(() => {
      const { online, offline } = input;
      if (![online, offline].every((n) => Number.isFinite(n) && n >= 0)) fail("Amounts can't be negative.");
      if (online + offline <= 0) fail("Enter an amount to record.");
      mutate((s) => {
        const b = find(s, id);
        const t = bookingTotals(b, s.rules, s.stations, Date.now());
        if (online + offline > t.remaining + 0.001 && t.total > 0)
          fail(`That's more than the ₹${t.remaining} remaining.`);
        const time = new Date().toISOString();
        const mk = (type: PayType, amount: number) =>
          amount > 0 && b.payments.push({ id: uid(), type, amount, reference: input.reference.trim().slice(0, 80), time, notes: input.notes.trim().slice(0, 200) });
        mk("online", online);
        mk("offline", offline);
        b.refunded = false;
      });
    }),

  markRefunded: (id: string) =>
    run(() => mutate((s) => { find(s, id).refunded = true; })),

  submit: (id: string) =>
    run(() =>
      mutate((s) => {
        const b = find(s, id);
        if (b.status === "completed") fail("Session already completed.");
        if (b.status !== "playing" || !b.sessionEndedAt) fail("End the session before submitting.");
        if (b.players.some((p) => !p.startTime || !p.endTime || Date.parse(p.endTime) < Date.parse(p.startTime)))
          fail("Every player needs valid start and end times.");
        const t = bookingTotals(b, s.rules, s.stations, Date.now());
        b.finalTotal = t.total;
        b.players.forEach((p) => {
          const full = t.remaining <= 0;
          p.paymentStatus = full ? "paid" : "unpaid";
          p.paymentMethod = full ? (t.online >= t.offline ? "online" : "offline") : null;
        });
        b.status = "completed";
        b.completedAt = new Date().toISOString();
        const st = s.stations.find((x) => x.id === b.stationId);
        if (st?.status === "playing") st.status = "available";
      }),
    ),

  setStationStatus: (stationId: string, status: StationStatus) =>
    run(() =>
      mutate((s) => {
        const st = s.stations.find((x) => x.id === stationId) ?? fail("Station not found.");
        if (st.type === "vr" && status !== "disabled" && status !== "maintenance") fail("VR is not open yet.");
        st.status = status;
      }),
    ),

  savePricing: (rules: PricingRule[]) =>
    run(() => {
      if (rules.some((r) => !(r.rate >= 0) || !(r.minMinutes >= 0) || (r.groupRate != null && r.groupRate < 0)))
        fail("Prices and minimums can't be negative.");
      mutate((s) => { s.rules = rules; });
    }),

  resetData: (mode: "demo" | "empty") =>
    run(() => setState(mode === "demo" ? seedState() : emptyState())),
};

export const todayISO = todayStr;
