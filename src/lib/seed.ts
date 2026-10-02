import type {
  Booking,
  BookingSource,
  DbState,
  Game,
  Payment,
  Player,
  PricingRule,
  Station,
} from "./types";
import { addDays, addMinutesToTime, todayStr } from "./time";
import { calcAmount } from "./pricing";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

export const DEFAULT_STATIONS: Station[] = [
  { id: "ps5-1", name: "PS5 · Station 01", type: "ps5", status: "available", notes: "" },
  { id: "ps5-2", name: "PS5 · Station 02", type: "ps5", status: "available", notes: "" },
  { id: "ps5-3", name: "PS5 · Station 03", type: "ps5", status: "available", notes: "" },
  { id: "sim-1", name: "Sim Racing Rig", type: "sim", status: "available", notes: "" },
  { id: "vr-1", name: "VR Zone", type: "vr", status: "disabled", notes: "Coming soon" },
];

const G = (
  id: string,
  title: string,
  genre: string,
  multiplayer: string,
  description: string,
  hue: number,
): Game => ({ id, title, genre, multiplayer, description, hue, image: "", active: true });

export const DEFAULT_GAMES: Game[] = [
  G("g1", "EA SPORTS FC 26", "Sports", "1–4 players", "Local derbies on the big screen.", 150),
  G("g2", "NBA 2K26", "Sports", "1–4 players", "Half-court showdowns, bragging rights included.", 28),
  G("g3", "Gran Turismo 7", "Racing", "1–2 players", "Pure driving craft, on wheel or pad.", 215),
  G("g4", "Tekken 8", "Fighting", "1–2 players", "First to three rounds buys the snacks.", 355),
  G("g5", "God of War Ragnarök", "Story", "Solo", "A cinematic campaign at your own pace.", 200),
  G("g6", "Marvel's Spider-Man 2", "Story", "Solo", "Swing through a city built to be explored.", 10),
  G("g7", "It Takes Two", "Multiplayer", "2 players", "Co-op only. Friendships optional.", 45),
  G("g8", "Overcooked! All You Can Eat", "Multiplayer", "1–4 players", "Chaos in the kitchen, loudly.", 95),
  G("g9", "Rocket League", "Competitive", "1–4 players", "Fast, fair and endlessly rematch-able.", 260),
];

export const DEFAULT_RULES: PricingRule[] = [
  { id: "r-ps5", stationType: "ps5", label: "PS5", rate: 300, unit: "hour", minMinutes: 10, groupRate: null, groupMinPlayers: 4, active: true },
  { id: "r-sim", stationType: "sim", label: "Sim Racing", rate: 500, unit: "hour", minMinutes: 15, groupRate: null, groupMinPlayers: 4, active: true },
  { id: "r-vr", stationType: "vr", label: "VR", rate: 0, unit: "hour", minMinutes: 0, groupRate: null, groupMinPlayers: 4, active: false },
];

const NAMES = ["Rahul", "Amit", "Karan", "Jay", "Rohan", "Neha", "Priya", "Vikram", "Sana", "Arjun", "Dev", "Isha", "Mihir", "Zoya"];
const SOURCES: BookingSource[] = ["website", "whatsapp", "phone", "walkin", "admin"];

let rnd = 7;
const rand = () => {
  rnd = (rnd * 16807) % 2147483647;
  return rnd / 2147483647;
};
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];

function blank(no: number, date: string, startTime: string, durationMin: number): Booking {
  const now = new Date().toISOString();
  return {
    id: uid(), no, customerName: "", phone: "", whatsapp: "", email: "", date, startTime, durationMin,
    stationId: "ps5-1", gameId: "g1", status: "pending", source: "website", notes: "",
    players: [], payments: [], sessionStartedAt: null, pausedAt: null, pausedMs: 0, sessionEndedAt: null,
    refunded: false, createdAt: now, updatedAt: now, completedAt: null, deletedAt: null, finalTotal: null,
  };
}

const player = (name: string, start: string | null, end: string | null, planned: number | null): Player => ({
  id: uid(), name, startTime: start, endTime: end, plannedMinutes: planned, rate: null, amount: null,
  overridden: false, paymentStatus: "unpaid", paymentMethod: null, notes: "",
});

export function seedState(): DbState {
  rnd = 7;
  const stations = DEFAULT_STATIONS.map((s) => ({ ...s }));
  const rules = DEFAULT_RULES;
  const bookings: Booking[] = [];
  let no = 100;
  const today = todayStr();

  // History: past 21 days
  for (let d = 21; d >= 1; d--) {
    const date = addDays(today, -d);
    const count = 2 + Math.floor(rand() * 4);
    for (let i = 0; i < count; i++) {
      no++;
      const hour = 12 + Math.floor(rand() * 9);
      const startTime = `${String(hour).padStart(2, "0")}:${rand() > 0.5 ? "00" : "30"}`;
      const dur = pick([60, 60, 90, 120]);
      const b = blank(no, date, startTime, dur);
      const stationId = pick(["ps5-1", "ps5-2", "ps5-3", "ps5-1", "ps5-2", "sim-1"]);
      b.stationId = stationId;
      b.gameId = stationId === "sim-1" ? "g3" : pick(DEFAULT_GAMES.slice(0, 9)).id;
      b.source = pick(SOURCES);
      b.customerName = pick(NAMES);
      b.phone = `9${String(Math.floor(rand() * 1e9)).padStart(9, "0")}`;
      if (rand() < 0.1) {
        b.status = "noshow";
        b.players = [player(b.customerName, null, null, null)];
        bookings.push(b);
        continue;
      }
      const n = stationId === "sim-1" ? 1 + Math.floor(rand() * 2) : 1 + Math.floor(rand() * 4);
      const startIso = new Date(`${date}T${startTime}:00`).toISOString();
      b.sessionStartedAt = startIso;
      let total = 0;
      for (let k = 0; k < n; k++) {
        const mins = k > 0 && rand() < 0.2 ? pick([10, 15, 20]) : dur;
        const endIso = new Date(Date.parse(startIso) + mins * 60000).toISOString();
        const p = player(k === 0 ? b.customerName : pick(NAMES), startIso, endIso, null);
        const stType = stationId === "sim-1" ? "sim" : "ps5";
        p.rate = rules.find((r) => r.stationType === stType)!.rate;
        p.amount = calcAmount(mins, rules.find((r) => r.stationType === stType), n);
        total += p.amount;
        b.players.push(p);
      }
      const endClock = addMinutesToTime(startTime, dur).time;
      b.sessionEndedAt = new Date(`${date}T${endClock}:00`).toISOString();
      const online = rand() < 0.5 ? Math.round((total * (0.4 + rand() * 0.4)) / 10) * 10 : rand() < 0.5 ? total : 0;
      const pays: Payment[] = [];
      if (online > 0) pays.push({ id: uid(), type: "online", amount: online, reference: `UPI${Math.floor(rand() * 1e8)}`, time: b.sessionEndedAt, notes: "" });
      if (total - online > 0) pays.push({ id: uid(), type: "offline", amount: total - online, reference: "", time: b.sessionEndedAt, notes: "" });
      b.payments = pays;
      b.players.forEach((p) => { p.paymentStatus = "paid"; p.paymentMethod = online >= total ? "online" : "offline"; });
      b.status = "completed";
      b.finalTotal = total;
      b.completedAt = b.sessionEndedAt;
      bookings.push(b);
    }
  }

  // Today's live scenario
  const now = new Date();
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const ago = new Date(now.getTime() - 40 * 60000);
  if (ago.getDate() === now.getDate()) {
    no++;
    const live = blank(no, today, hhmm(ago), 120);
    live.customerName = "Rahul Mehta"; live.phone = "9810011122"; live.stationId = "ps5-2"; live.gameId = "g1";
    live.source = "whatsapp"; live.status = "playing"; live.sessionStartedAt = ago.toISOString();
    live.players = ["Rahul", "Amit", "Karan", "Jay", "Rohan"].map((n) => player(n, ago.toISOString(), null, null));
    live.players[3].plannedMinutes = 10;
    live.payments = [{ id: uid(), type: "online", amount: 300, reference: "UPI advance", time: ago.toISOString(), notes: "Advance" }];
    bookings.push(live);
    stations.find((s) => s.id === "ps5-2")!.status = "playing";
  }
  const soon = new Date(now.getTime() + 50 * 60000);
  if (soon.getDate() === now.getDate()) {
    no++;
    const up = blank(no, today, hhmm(soon), 60);
    up.customerName = "Neha Kapoor"; up.phone = "9822233344"; up.stationId = "ps5-3"; up.gameId = "g4";
    up.status = "confirmed"; up.source = "phone";
    up.players = [player("Neha", null, null, null), player("Dev", null, null, null)];
    bookings.push(up);
    stations.find((s) => s.id === "ps5-3")!.status = "booked";
  }
  const later = new Date(now.getTime() + 3 * 3600000);
  if (later.getDate() === now.getDate()) {
    no++;
    const p = blank(no, today, hhmm(later), 90);
    p.customerName = "Sana Iyer"; p.phone = "9833344455"; p.stationId = "ps5-1"; p.gameId = "g9";
    p.status = "pending"; p.notes = "Birthday group, may bring 2 extra.";
    p.players = ["Sana", "Isha", "Mihir", "Zoya"].map((n) => player(n, null, null, null));
    bookings.push(p);
  }
  no++;
  const tm = blank(no, addDays(today, 1), "18:00", 60);
  tm.customerName = "Vikram Rao"; tm.phone = "9844455566"; tm.stationId = "sim-1"; tm.gameId = "g3";
  tm.status = "pending"; tm.source = "website";
  tm.players = [player("Vikram", null, null, null)];
  bookings.push(tm);

  return { stations, games: DEFAULT_GAMES, rules, bookings, seq: no + 1, version: 1 };
}

export function emptyState(): DbState {
  return {
    stations: DEFAULT_STATIONS.map((s) => ({ ...s })),
    games: DEFAULT_GAMES,
    rules: DEFAULT_RULES,
    bookings: [],
    seq: 101,
    version: 1,
  };
}
