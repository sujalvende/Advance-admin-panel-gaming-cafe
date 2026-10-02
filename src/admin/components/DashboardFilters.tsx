import { Search } from "lucide-react";
import { useDb } from "../../lib/store";
import { SOURCE_LABEL, STATUS_LABEL } from "../../lib/types";

export interface Filters {
  range: string; from: string; to: string; station: string; game: string;
  method: string; source: string; status: string; q: string; sort: string;
}

const RANGES = [["today", "Today"], ["yesterday", "Yesterday"], ["week", "This week"], ["month", "This month"], ["custom", "Custom"]];
export const SORTS = [["newest", "Newest"], ["oldest", "Oldest"], ["revenue", "Highest revenue"], ["longest", "Longest session"], ["shortest", "Shortest session"]];

export default function DashboardFilters({ f, set }: { f: Filters; set: (p: Partial<Filters>) => void }) {
  const { stations, games } = useDb();
  const sel = (id: string, label: string, value: string, key: keyof Filters, opts: [string, string][]) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <select id={id} className="input !min-h-11" value={value} onChange={(e) => set({ [key]: e.target.value })}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <section className="card p-4 sm:p-5" aria-label="Filters">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Date range">
        {RANGES.map(([v, l]) => (
          <button key={v} type="button" aria-pressed={f.range === v} onClick={() => set({ range: v })}
            className={`btn btn-sm shrink-0 border ${f.range === v ? "border-bone bg-bone text-ink" : "border-line text-mute hover:text-bone"}`}>{l}</button>
        ))}
      </div>
      {f.range === "custom" && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
          <div><label className="label" htmlFor="f-from">From</label><input id="f-from" type="date" className="input !min-h-11" value={f.from} max={f.to} onChange={(e) => set({ from: e.target.value })} /></div>
          <div><label className="label" htmlFor="f-to">To</label><input id="f-to" type="date" className="input !min-h-11" value={f.to} min={f.from} onChange={(e) => set({ to: e.target.value })} /></div>
        </div>
      )}
      <div className="relative mt-4">
        <label htmlFor="f-q" className="sr-only">Search history</label>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mute" aria-hidden />
        <input id="f-q" type="search" className="input pl-12" placeholder="Search customer, phone, player or booking ID" value={f.q} onChange={(e) => set({ q: e.target.value })} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {sel("f-st", "Station", f.station, "station", [["all", "All stations"], ...stations.filter((s) => s.type !== "vr").map((s) => [s.id, s.name.replace(" · ", " ")] as [string, string])])}
        {sel("f-gm", "Game", f.game, "game", [["all", "All games"], ...games.map((g) => [g.id, g.title] as [string, string])])}
        {sel("f-pm", "Payment", f.method, "method", [["all", "Any method"], ["online", "Online"], ["offline", "Cash"], ["both", "Both"]])}
        {sel("f-sr", "Source", f.source, "source", [["all", "All sources"], ...Object.entries(SOURCE_LABEL)])}
        {sel("f-ss", "Status", f.status, "status", [["all", "Completed, no-show, cancelled"], ["completed", STATUS_LABEL.completed], ["noshow", STATUS_LABEL.noshow], ["cancelled", STATUS_LABEL.cancelled]])}
        {sel("f-so", "Sort by", f.sort, "sort", SORTS as [string, string][])}
      </div>
    </section>
  );
}
