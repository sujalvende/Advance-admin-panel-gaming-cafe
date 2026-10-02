import type { Booking, Player, PricingRule, Station, StationType } from "./types";

export function ruleFor(rules: PricingRule[], type: StationType): PricingRule | undefined {
  return rules.find((r) => r.stationType === type && r.active);
}

/** Pure billing function: minutes + rule (+ group size) -> rupees. */
export function calcAmount(minutes: number, rule: PricingRule | undefined, playerCount = 1) {
  if (!rule || minutes <= 0) return 0;
  const rate =
    rule.groupRate != null && playerCount >= rule.groupMinPlayers ? rule.groupRate : rule.rate;
  const billable = Math.max(minutes, rule.minMinutes);
  if (rule.unit === "half_hour") return Math.round((Math.ceil(billable / 30) * rate) / 2);
  return Math.round((billable / 60) * rate);
}

export function effectiveRate(rule: PricingRule | undefined, playerCount: number) {
  if (!rule) return 0;
  return rule.groupRate != null && playerCount >= rule.groupMinPlayers ? rule.groupRate : rule.rate;
}

export function playerMinutes(b: Booking, p: Player, now: number) {
  if (p.startTime && p.endTime) {
    return Math.max(0, Math.round((Date.parse(p.endTime) - Date.parse(p.startTime)) / 60000));
  }
  if (p.startTime && b.sessionStartedAt && !b.sessionEndedAt) {
    const ref = b.pausedAt ? Date.parse(b.pausedAt) : now;
    return Math.max(0, Math.floor((ref - Date.parse(p.startTime)) / 60000));
  }
  return p.plannedMinutes ?? b.durationMin;
}

export function playerAmount(
  b: Booking,
  p: Player,
  rules: PricingRule[],
  stations: Station[],
  now: number,
) {
  if (p.amount != null) return p.amount;
  const type = stations.find((s) => s.id === b.stationId)?.type ?? "ps5";
  return calcAmount(playerMinutes(b, p, now), ruleFor(rules, type), b.players.length);
}

export interface Totals {
  total: number;
  online: number;
  offline: number;
  paid: number;
  remaining: number;
  playerMinutes: number;
  status: "unpaid" | "partial" | "paid" | "refunded";
}

export function bookingTotals(
  b: Booking,
  rules: PricingRule[],
  stations: Station[],
  now: number,
): Totals {
  const total =
    b.finalTotal ??
    b.players.reduce((s, p) => s + playerAmount(b, p, rules, stations, now), 0);
  const online = b.payments.filter((p) => p.type === "online").reduce((s, p) => s + p.amount, 0);
  const offline = b.payments.filter((p) => p.type === "offline").reduce((s, p) => s + p.amount, 0);
  const paid = online + offline;
  const remaining = Math.max(0, total - paid);
  const status = b.refunded
    ? "refunded"
    : paid <= 0
      ? "unpaid"
      : remaining > 0
        ? "partial"
        : "paid";
  return {
    total,
    online,
    offline,
    paid,
    remaining,
    status,
    playerMinutes: b.players.reduce((s, p) => s + playerMinutes(b, p, now), 0),
  };
}
