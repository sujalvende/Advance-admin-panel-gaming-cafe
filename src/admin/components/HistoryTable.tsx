import { Fragment, useState } from "react";
import { AlertTriangle, ChevronDown, RotateCcw } from "lucide-react";
import type { Row } from "../../lib/analytics";
import { SOURCE_LABEL } from "../../lib/types";
import { fmtClock, fmtDate, fmtDur, fmtINR, fmtTime } from "../../lib/time";
import { endClock } from "../../lib/conflicts";
import StatusBadge, { PayBadge } from "./StatusBadge";

function PlayerTable({ r }: { r: Row }) {
  const b = r.b;
  // Detect whether we have real session timestamps
  const hasActualTimes = !!b.sessionStartedAt && !!b.sessionEndedAt;
  const sessionInconsistent = b.players.some(
    (p) =>
      p.startTime &&
      b.sessionStartedAt &&
      Date.parse(p.startTime) < Date.parse(b.sessionStartedAt) - 60000,
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-mute">
            <tr><th className="py-2 pr-3 font-medium">Player</th><th className="px-3 font-medium">Played</th><th className="px-3 font-medium">Duration</th><th className="px-3 text-right font-medium">Amount</th><th className="pl-3 font-medium">Payment</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {b.players.map((p) => {
              // Use Math.floor for consistency with pricing.ts playerMinutes()
              const mins =
                p.startTime && p.endTime
                  ? Math.max(0, Math.floor((Date.parse(p.endTime) - Date.parse(p.startTime)) / 60000))
                  : 0;
              return (
                <tr key={p.id}>
                  <td className="py-2 pr-3 font-semibold">{p.name}</td>
                  <td className="px-3 text-mute">{fmtClock(p.startTime)} – {fmtClock(p.endTime)}</td>
                  <td className="px-3">{fmtDur(mins)}</td>
                  <td className="px-3 text-right font-mono">{fmtINR(p.amount ?? 0)}</td>
                  <td className="pl-3 font-medium">
                    {p.paymentStatus === "paid" ? (
                      <span className="text-ok">
                        Paid{p.paymentMethod ? ` · ${p.paymentMethod === "online" ? "Online" : "Cash"}` : ""}
                      </span>
                    ) : (
                      <span className="text-bad/80">Unpaid</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sessionInconsistent && (
        <p className="mt-2 flex items-center gap-2 rounded-xl bg-warn/10 px-3 py-2 text-xs text-warn">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          Some player timestamps pre-date the session start — timestamps may be inconsistent.
        </p>
      )}
      <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-3 text-sm">
        <span>
          <span className="text-mute">Session duration </span>
          <b>{hasActualTimes ? fmtDur(r.t.sessionDuration) : "—"}</b>
        </span>
        <span>
          <span className="text-mute">Total player time </span>
          <b>{fmtDur(r.t.playerMinutes)}</b>
          <span className="ml-1 text-xs text-mute">({r.t.playerMinutes} min across {b.players.length} player{b.players.length > 1 ? "s" : ""})</span>
        </span>
        <span><span className="text-mute">Revenue </span><b className="font-mono">{fmtINR(r.t.total)}</b></span>
        <span><span className="text-mute">Online </span><b className="font-mono">{fmtINR(r.t.online)}</b></span>
        <span><span className="text-mute">Cash </span><b className="font-mono">{fmtINR(r.t.offline)}</b></span>
      </p>
    </div>
  );
}

export default function HistoryTable({ rows, onRestore }: { rows: Row[]; onRestore?: (id: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(25);
  if (rows.length === 0)
    return <p className="rounded-3xl border border-dashed border-line px-6 py-14 text-center text-mute">No sessions match these filters.</p>;

  return (
    <div className="card overflow-hidden">
      <div className="hidden grid-cols-[1.6fr_1fr_1.2fr_.8fr_.9fr_.9fr_auto] gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wider text-mute lg:grid">
        <span>Customer</span><span>Date</span><span>Station · Game</span><span>Duration</span><span>Total</span><span>Payment</span><span className="w-5" />
      </div>
      <ul className="divide-y divide-line">
        {rows.slice(0, limit).map((r) => {
          const isOpen = open === r.b.id;
          const b = r.b;
          return (
            <Fragment key={b.id}>
              <li>
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : b.id)}
                  className="grid w-full grid-cols-2 items-center gap-x-4 gap-y-2 px-4 py-4 text-left transition-colors hover:bg-white/[.03] sm:px-5 lg:grid-cols-[1.6fr_1fr_1.2fr_.8fr_.9fr_.9fr_auto]">
                  <span className="col-span-2 min-w-0 lg:col-span-1">
                    <span className="flex flex-wrap items-center gap-2"><b className="truncate">{b.customerName}</b><span className="font-mono text-xs text-mute">#{b.no}</span><StatusBadge booking={b} /></span>
                    <span className="mt-0.5 block text-xs text-mute">{b.players.length} player{b.players.length > 1 ? "s" : ""} · {SOURCE_LABEL[b.source]} · {b.phone}</span>
                  </span>
                  {/* Date column: show actual session times for completed bookings */}
                  <span className="text-sm">
                    <span className="block">{fmtDate(b.date)}</span>
                    {b.status === "completed" && b.sessionStartedAt && b.sessionEndedAt ? (
                      <span className="text-xs text-mute">
                        {fmtClock(b.sessionStartedAt)} – {fmtClock(b.sessionEndedAt)}
                        <span className="ml-1 opacity-60">(actual)</span>
                      </span>
                    ) : (
                      <span className="text-xs text-mute">
                        {fmtTime(b.startTime)} – {fmtTime(endClock(b))}
                        {b.status === "completed" && <span className="ml-1 opacity-60">(scheduled)</span>}
                      </span>
                    )}
                  </span>
                  <span className="text-sm"><span className="block">{r.stationName}</span><span className="text-xs text-mute">{r.gameTitle}</span></span>
                  {/* Duration column: actual session duration, NOT total player-minutes */}
                  <span className="text-sm">
                    {b.status === "completed" ? fmtDur(r.t.sessionDuration) : "—"}
                  </span>
                  <span className="font-mono text-sm"><b>{b.status === "completed" ? fmtINR(r.t.total) : "—"}</b></span>
                  <span>{b.status === "completed" ? <PayBadge status={r.t.status} /> : <span className="text-xs text-mute">n/a</span>}
                    {r.t.remaining > 0 && b.status === "completed" && <span className="mt-1 block text-xs text-warn">Due {fmtINR(r.t.remaining)}</span>}</span>
                  <ChevronDown className={`hidden size-4 text-mute transition-transform lg:block ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
              </li>
              {isOpen && (
                <li className="bg-panel2/50 px-4 py-4 sm:px-5">
                  {b.status === "completed" ? <PlayerTable r={r} /> : <p className="text-sm text-mute">{b.status === "noshow" ? "Customer did not arrive. Kept for booking-loss tracking." : "Booking was cancelled."}{b.notes && ` Notes: ${b.notes}`}</p>}
                  {b.status === "completed" && b.payments.length > 0 && (
                    <ul className="mt-3 text-xs text-mute">
                      {b.payments.map((p) => {
                        const targetPlayer = p.playerId ? b.players.find((pl) => pl.id === p.playerId) : null;
                        return (
                          <li key={p.id}>
                            {p.type === "online" ? "Online" : "Cash"} {fmtINR(p.amount)}
                            {targetPlayer ? ` · for ${targetPlayer.name}` : " · Group"}
                            {p.reference && ` · Ref: ${p.reference}`}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {onRestore && <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={() => onRestore(b.id)}><RotateCcw className="size-3.5" /> Restore</button>}
                </li>
              )}
            </Fragment>
          );
        })}
      </ul>
      {rows.length > limit && (
        <div className="border-t border-line p-4 text-center"><button type="button" className="btn btn-ghost" onClick={() => setLimit((l) => l + 25)}>Show more ({rows.length - limit} left)</button></div>
      )}
    </div>
  );
}
