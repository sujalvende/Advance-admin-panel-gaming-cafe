import { fmtHours, fmtINR } from "../../lib/time";
import type { Summary } from "../../lib/analytics";

export function KpiRow({ s }: { s: Summary }) {
  const items = [
    ["Total revenue", fmtINR(s.revenue)],
    ["Sessions", String(s.completed)],
    ["Players", String(s.players)],
    ["Play time", fmtHours(s.minutes)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(([l, v]) => (
        <div key={l} className="card px-5 py-5">
          <dt className="text-xs font-semibold uppercase tracking-widest text-mute">{l}</dt>
          <dd className="display mt-1 text-5xl sm:text-6xl">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PeriodCard({ title, s, detailed }: { title: string; s: Summary; detailed?: boolean }) {
  const rows: [string, string][] = [
    ["Bookings", String(s.bookings)],
    ...(detailed ? ([["Completed", String(s.completed)], ["No-shows", String(s.noShows)]] as [string, string][]) : []),
    ["Players", String(s.players)],
    ["Hours played", fmtHours(s.minutes)],
    ["Revenue", fmtINR(s.revenue)],
    ...(detailed ? ([["Online", fmtINR(s.online)], ["Cash", fmtINR(s.cash)]] as [string, string][]) : []),
  ];
  return (
    <section className="card p-5" aria-label={title}>
      <h3 className="display text-3xl">{title}</h3>
      <dl className="mt-3 divide-y divide-line text-sm">
        {rows.map(([l, v]) => (
          <div key={l} className="flex justify-between py-2"><dt className="text-mute">{l}</dt><dd className="font-mono font-semibold tabular-nums">{v}</dd></div>
        ))}
      </dl>
    </section>
  );
}
