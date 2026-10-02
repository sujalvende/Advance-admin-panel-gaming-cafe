import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useDb } from "../../lib/store";
import { csvEscape, periodRows, presets, summarize, toRows } from "../../lib/analytics";
import { fmtDate, fmtTime, todayStr } from "../../lib/time";
import { SOURCE_LABEL, STATUS_LABEL } from "../../lib/types";
import { endClock } from "../../lib/conflicts";
import DashboardFilters, { type Filters } from "../components/DashboardFilters";
import { KpiRow, PeriodCard } from "../components/RevenueCards";
import Charts from "../components/RevenueChart";
import HistoryTable from "../components/HistoryTable";

export default function Dashboard() {
  const db = useDb();
  const t = todayStr();
  const [f, setF] = useState<Filters>({ range: "month", from: t, to: t, station: "all", game: "all", method: "all", source: "all", status: "all", q: "", sort: "newest" });
  const set = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }));

  const all = useMemo(() => toRows(db), [db]);
  const [from, to] = f.range === "custom" ? [f.from, f.to] : presets()[f.range];

  const periods = useMemo(() => {
    const p = presets();
    return { today: summarize(periodRows(all, ...p.today)), week: summarize(periodRows(all, ...p.week)), month: summarize(periodRows(all, ...p.month)) };
  }, [all]);

  const inRange = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return periodRows(all, from, to).filter((r) => {
      const b = r.b;
      if (f.status === "all" ? !["completed", "noshow", "cancelled"].includes(b.status) : b.status !== f.status) return false;
      if (f.station !== "all" && b.stationId !== f.station) return false;
      if (f.game !== "all" && b.gameId !== f.game) return false;
      if (f.source !== "all" && b.source !== f.source) return false;
      if (f.method === "online" && r.t.online <= 0) return false;
      if (f.method === "offline" && r.t.offline <= 0) return false;
      if (f.method === "both" && !(r.t.online > 0 && r.t.offline > 0)) return false;
      if (q && ![b.customerName, b.phone, String(b.no), ...b.players.map((p) => p.name)].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [all, from, to, f]);

  const rows = useMemo(() => {
    const key = (r: (typeof inRange)[number]) => `${r.b.date}T${r.b.startTime}`;
    const s = [...inRange];
    const sorts: Record<string, (a: (typeof s)[number], b: (typeof s)[number]) => number> = {
      newest: (a, b) => key(b).localeCompare(key(a)),
      oldest: (a, b) => key(a).localeCompare(key(b)),
      revenue: (a, b) => b.t.total - a.t.total,
      longest: (a, b) => b.t.playerMinutes - a.t.playerMinutes,
      shortest: (a, b) => a.t.playerMinutes - b.t.playerMinutes,
    };
    return s.sort(sorts[f.sort]);
  }, [inRange, f.sort]);

  const summary = summarize(rows);

  function exportCsv() {
    const head = ["Booking", "Date", "Start", "End", "Customer", "Phone", "Players", "Station", "Game", "Source", "Status", "Player-minutes", "Total", "Online", "Cash", "Remaining"];
    const lines = rows.map((r) => [r.b.no, r.b.date, fmtTime(r.b.startTime), fmtTime(endClock(r.b)), r.b.customerName, r.b.phone, r.b.players.length, r.stationName, r.gameTitle, SOURCE_LABEL[r.b.source], STATUS_LABEL[r.b.status], r.t.playerMinutes, r.t.total, r.t.online, r.t.offline, r.t.remaining].map(csvEscape).join(","));
    const url = URL.createObjectURL(new Blob([[head.map(csvEscape).join(","), ...lines].join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `respawn-history-${from}-to-${to}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">History & analytics</p>
          <h1 className="display mt-1 text-5xl sm:text-6xl">Dashboard</h1>
        </div>
        <button type="button" className="btn btn-ghost" onClick={exportCsv} disabled={rows.length === 0}><Download className="size-4" /> Export CSV</button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <PeriodCard title="Today" s={periods.today} detailed />
        <PeriodCard title="This week" s={periods.week} />
        <PeriodCard title="This month" s={periods.month} />
      </div>

      <div className="mt-10 space-y-4">
        <DashboardFilters f={f} set={set} />
        <p className="text-sm text-mute">{fmtDate(from)} – {fmtDate(to)} · {rows.length} record{rows.length === 1 ? "" : "s"}</p>
        <KpiRow s={summary} />
        <Charts rows={rows} from={from} to={to} />
      </div>

      <h2 className="display mb-4 mt-12 text-4xl">Session history</h2>
      <HistoryTable rows={rows} />
    </>
  );
}
