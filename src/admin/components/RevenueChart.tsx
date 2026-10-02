import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Row } from "../../lib/analytics";
import { addDays, fmtINR } from "../../lib/time";

const ONLINE = "#ff6a3d";
const CASH = "#e6d7bd";
const axis = { stroke: "#a69e94", fontSize: 12, tickLine: false, axisLine: false } as const;
const tip = {
  contentStyle: { background: "#1d1a17", border: "1px solid rgba(255,244,230,.12)", borderRadius: 12, color: "#f3ede4", fontSize: 13 },
  cursor: { fill: "rgba(255,244,230,.05)" },
  labelStyle: { color: "#a69e94" },
  itemStyle: { color: "#f3ede4" },
} as const;

function Panel({ title, sub, children, empty }: { title: string; sub?: string; children: ReactNode; empty: boolean }) {
  return (
    <section className="card p-5" aria-label={title}>
      <h3 className="display text-3xl">{title}</h3>
      {sub && <p className="text-xs text-mute">{sub}</p>}
      <div className="mt-4 h-60">
        {empty ? <p className="grid h-full place-items-center rounded-2xl border border-dashed border-line text-sm text-mute">No completed sessions in this range.</p> : children}
      </div>
    </section>
  );
}

function days(from: string, to: string) {
  const out: string[] = [];
  let d = to;
  while (d >= from && out.length < 31) { out.unshift(d); d = addDays(d, -1); }
  return out;
}
const short = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function Charts({ rows, from, to }: { rows: Row[]; from: string; to: string }) {
  const done = rows.filter((r) => r.b.status === "completed");
  const empty = done.length === 0;
  const range = days(from, to);
  const perDay = range.map((d) => {
    const r = done.filter((x) => x.b.date === d);
    return { d: short(d), Online: r.reduce((s, x) => s + x.t.online, 0), Cash: r.reduce((s, x) => s + x.t.offline, 0), Sessions: r.length };
  });
  const online = done.reduce((s, r) => s + r.t.online, 0);
  const cash = done.reduce((s, r) => s + r.t.offline, 0);
  const byStation = Object.entries(done.reduce<Record<string, number>>((m, r) => ((m[r.stationName] = (m[r.stationName] ?? 0) + r.t.playerMinutes / 60), m), {}))
    .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 })).sort((a, b) => b.hours - a.hours);
  const byGame = Object.entries(done.reduce<Record<string, number>>((m, r) => ((m[r.gameTitle] = (m[r.gameTitle] ?? 0) + 1), m), {}))
    .map(([name, sessions]) => ({ name, sessions })).sort((a, b) => b.sessions - a.sessions).slice(0, 6);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Revenue over time" sub="Collected payments per day" empty={empty}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={perDay} margin={{ left: -8, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,244,230,.07)" />
            <XAxis dataKey="d" {...axis} interval="preserveStartEnd" minTickGap={24} />
            <YAxis {...axis} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
            <Tooltip {...tip} formatter={(v) => fmtINR(Number(v))} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#a69e94" }} />
            <Bar dataKey="Online" stackId="a" fill={ONLINE} />
            <Bar dataKey="Cash" stackId="a" fill={CASH} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Sessions per day" empty={empty}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={perDay} margin={{ left: -24, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,244,230,.07)" />
            <XAxis dataKey="d" {...axis} interval="preserveStartEnd" minTickGap={24} />
            <YAxis {...axis} allowDecimals={false} />
            <Tooltip {...tip} />
            <Bar dataKey="Sessions" fill={ONLINE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Online vs cash" empty={empty || online + cash === 0}>
        <div className="flex h-full items-center gap-6">
          <ResponsiveContainer width="55%" height="100%">
            <PieChart>
              <Pie data={[{ name: "Online", v: online }, { name: "Cash", v: cash }]} dataKey="v" nameKey="name" innerRadius="58%" outerRadius="90%" stroke="#151311" strokeWidth={3}>
                <Cell fill={ONLINE} /><Cell fill={CASH} />
              </Pie>
              <Tooltip {...tip} formatter={(v) => fmtINR(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="space-y-3 text-sm">
            <li><span className="mr-2 inline-block size-2.5 rounded-full" style={{ background: ONLINE }} />Online <b className="block font-mono text-lg">{fmtINR(online)}</b></li>
            <li><span className="mr-2 inline-block size-2.5 rounded-full" style={{ background: CASH }} />Cash <b className="block font-mono text-lg">{fmtINR(cash)}</b></li>
          </ul>
        </div>
      </Panel>
      <Panel title="Station utilization" sub="Player-hours" empty={empty}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byStation} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" {...axis} />
            <YAxis type="category" dataKey="name" {...axis} width={96} />
            <Tooltip {...tip} formatter={(v) => `${v} h`} />
            <Bar dataKey="hours" fill={ONLINE} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <div className="lg:col-span-2">
        <Panel title="Popular games" sub="Completed sessions" empty={empty}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byGame} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" {...axis} allowDecimals={false} />
              <YAxis type="category" dataKey="name" {...axis} width={150} />
              <Tooltip {...tip} />
              <Bar dataKey="sessions" fill={CASH} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
