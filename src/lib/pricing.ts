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
  overpaid: number;
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
  const overpaid = Math.max(0, paid - total);
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
    overpaid,
    status,
    playerMinutes: b.players.reduce((s, p) => s + playerMinutes(b, p, now), 0),
  };
}

/* ------------------------------------------------------------------ */
/*  Per-player payment breakdown from actual Payment records          */
/* ------------------------------------------------------------------ */

export interface PlayerPayInfo {
  charge: number;
  allocated: number;
  online: number;
  offline: number;
  remaining: number;
  status: "unpaid" | "paid";
  method: "online" | "offline" | null;
}

/** Calculate all players' payment info, attributing direct payments to specific players
 *  and allocating group payments (where playerId is null) to players with unmet charges. */
export function allPlayersPaymentInfo(
  b: Booking,
  rules: PricingRule[],
  stations: Station[],
  now: number,
): Map<string, PlayerPayInfo> {
  const map = new Map<
    string,
    {
      charge: number;
      directOnline: number;
      directOffline: number;
      directTotal: number;
      unmet: number;
    }
  >();

  for (const p of b.players) {
    const charge = playerAmount(b, p, rules, stations, now);
    const pays = b.payments.filter((pay) => pay.playerId === p.id);
    const directOnline = pays.filter((pay) => pay.type === "online").reduce((s, pay) => s + pay.amount, 0);
    const directOffline = pays.filter((pay) => pay.type === "offline").reduce((s, pay) => s + pay.amount, 0);
    const directTotal = directOnline + directOffline;
    const unmet = Math.max(0, charge - directTotal);
    map.set(p.id, { charge, directOnline, directOffline, directTotal, unmet });
  }

  // Group / unallocated payments (where playerId is null)
  const groupPays = b.payments.filter((pay) => !pay.playerId);
  let groupOnlineRem = groupPays.filter((pay) => pay.type === "online").reduce((s, pay) => s + pay.amount, 0);
  let groupOfflineRem = groupPays.filter((pay) => pay.type === "offline").reduce((s, pay) => s + pay.amount, 0);

  const result = new Map<string, PlayerPayInfo>();

  for (const p of b.players) {
    const data = map.get(p.id)!;
    let groupAllocOnline = 0;
    let groupAllocOffline = 0;
    let needed = data.unmet;

    if (needed > 0 && groupOnlineRem > 0) {
      const take = Math.min(needed, groupOnlineRem);
      groupAllocOnline += take;
      groupOnlineRem -= take;
      needed -= take;
    }

    if (needed > 0 && groupOfflineRem > 0) {
      const take = Math.min(needed, groupOfflineRem);
      groupAllocOffline += take;
      groupOfflineRem -= take;
      needed -= take;
    }

    const totalOnline = data.directOnline + groupAllocOnline;
    const totalOffline = data.directOffline + groupAllocOffline;
    const allocated = totalOnline + totalOffline;
    const remaining = Math.max(0, data.charge - allocated);

    // If session is already completed or player was already paid, preserve paid status
    const isExplicitlyPaid = (b.status === "completed" || b.sessionEndedAt) && p.paymentStatus === "paid";
    const status: "unpaid" | "paid" =
      data.charge <= 0 || allocated >= data.charge || isExplicitlyPaid ? "paid" : "unpaid";

    const method: "online" | "offline" | null =
      allocated > 0
        ? totalOnline >= totalOffline
          ? "online"
          : "offline"
        : isExplicitlyPaid
          ? p.paymentMethod ?? null
          : null;

    result.set(p.id, {
      charge: data.charge,
      allocated,
      online: totalOnline,
      offline: totalOffline,
      remaining,
      status,
      method,
    });
  }

  return result;
}

/** Calculate a single player's payment info from allocated Payment records. */
export function playerPaymentInfo(
  b: Booking,
  p: Player,
  rules: PricingRule[],
  stations: Station[],
  now: number,
  _bookingFullyPaid = false,
): PlayerPayInfo {
  const all = allPlayersPaymentInfo(b, rules, stations, now);
  const found = all.get(p.id);
  if (found) return found;

  const charge = playerAmount(b, p, rules, stations, now);
  return {
    charge,
    allocated: 0,
    online: 0,
    offline: 0,
    remaining: charge,
    status: charge <= 0 ? "paid" : "unpaid",
    method: null,
  };
}


