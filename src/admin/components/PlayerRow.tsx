import { Pencil, Square, Trash2 } from "lucide-react";
import type { Booking, Player } from "../../lib/types";
import { useDb, useNow } from "../../lib/store";
import { playerAmount, playerMinutes, ruleFor, effectiveRate } from "../../lib/pricing";
import { fmtClock, fmtDur, fmtINR } from "../../lib/time";

export default function PlayerRow({
  booking, player, index, locked, busy, onEdit, onRemove, onStop,
}: {
  booking: Booking; player: Player; index: number; locked: boolean; busy: boolean;
  onEdit: () => void; onRemove: () => void; onStop: () => void;
}) {
  const { rules, stations } = useDb();
  const now = useNow(booking.status === "playing" && !booking.sessionEndedAt ? 15000 : 600000);
  const mins = playerMinutes(booking, player, now);
  const amount = playerAmount(booking, player, rules, stations, now);
  const type = stations.find((s) => s.id === booking.stationId)?.type ?? "ps5";
  const rate = player.rate ?? effectiveRate(ruleFor(rules, type), booking.players.length);
  const running = !!player.startTime && !player.endTime && booking.status === "playing" && !booking.sessionEndedAt;
  const estimate = !player.startTime && !player.endTime;

  return (
    <li className="rounded-2xl border border-line bg-ink p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            <span className="font-mono text-xs text-mute">P{index + 1}</span>
            <span className="truncate">{player.name}</span>
            {running && <span className="pulse-dot size-2 shrink-0 rounded-full bg-ember text-ember" aria-label="Running" />}
          </p>
          <p className="mt-1 text-xs text-mute">
            {estimate ? "Not started" : `${fmtClock(player.startTime)} → ${player.endTime ? fmtClock(player.endTime) : "running"}`}
            {" · "}{estimate ? "plan " : ""}{fmtDur(mins)}{" · "}{fmtINR(rate)}/h
            {player.overridden && <b className="ml-1 text-warn">· manual</b>}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block font-mono text-lg font-semibold tabular-nums">{fmtINR(amount)}</span>
          {player.paymentStatus === "paid" && <span className="text-xs text-ok">Paid</span>}
        </p>
      </div>
      {!locked && (
        <div className="mt-3 flex flex-wrap gap-2">
          {running && (
            <button type="button" disabled={busy} onClick={onStop} className="btn btn-soft btn-sm"><Square className="size-3.5" /> Stop {player.name.split(" ")[0]}</button>
          )}
          <button type="button" onClick={onEdit} className="btn btn-ghost btn-sm"><Pencil className="size-3.5" /> Edit</button>
          <button type="button" disabled={busy || booking.players.length <= 1} onClick={onRemove} className="btn btn-ghost btn-sm text-bad"><Trash2 className="size-3.5" /> Remove</button>
        </div>
      )}
    </li>
  );
}
