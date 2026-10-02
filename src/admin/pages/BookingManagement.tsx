import { useMemo, useState, type ReactNode } from "react";
import { CalendarPlus, IndianRupee, Plus, Search } from "lucide-react";
import { useDb, useNow } from "../../lib/store";
import { bookingTotals } from "../../lib/pricing";
import { fmtINR, todayStr, toMs } from "../../lib/time";
import BookingCard from "../components/BookingCard";
import StationManager from "../components/StationManager";
import BookingFormModal from "../components/BookingFormModal";
import PricingModal from "../components/PricingModal";

function Section({ title, count, children, empty }: { title: string; count: number; children: ReactNode; empty: string }) {
  return (
    <section className="mt-10" aria-label={title}>
      <h2 className="mb-4 flex items-baseline gap-3"><span className="display text-4xl">{title}</span><span className="font-mono text-sm text-mute">{count}</span></h2>
      {count === 0 ? <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-mute">{empty}</p> : <div className="grid gap-4">{children}</div>}
    </section>
  );
}

export default function BookingManagement() {
  const { bookings, stations, rules } = useDb();
  const now = useNow(30000);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [pricing, setPricing] = useState(false);
  const today = todayStr();

  const data = useMemo(() => {
    const live = bookings.filter((b) => !b.deletedAt);
    const term = q.trim().toLowerCase();
    const match = (b: (typeof live)[number]) =>
      !term || [b.customerName, b.phone, String(b.no), ...b.players.map((p) => p.name)].some((v) => v.toLowerCase().includes(term));
    const sorted = (a: typeof live) => [...a].sort((x, y) => toMs(x.date, x.startTime) - toMs(y.date, y.startTime));
    const playing = live.filter((b) => b.status === "playing" && !b.sessionEndedAt);
    const ended = live.filter((b) => b.status === "playing" && b.sessionEndedAt);
    const upcoming = sorted(live.filter((b) => ["pending", "confirmed", "delayed"].includes(b.status)));
    const totals = (b: (typeof live)[number]) => bookingTotals(b, rules, stations, now);
    const dueBookings = live.filter((b) => ["playing", "completed"].includes(b.status) && (b.sessionEndedAt || b.status === "completed") && totals(b).remaining > 0 && !b.refunded);
    const revenueToday = live.flatMap((b) => b.payments).filter((p) => todayStr(new Date(p.time)) === today).reduce((s, p) => s + p.amount, 0);
    return {
      playing: playing.filter(match), ended: ended.filter(match), upcoming: upcoming.filter(match),
      stats: {
        active: playing.length,
        upcomingToday: upcoming.filter((b) => b.date === today).length,
        free: stations.filter((s) => s.type === "ps5" && s.status === "available").length,
        dueCount: dueBookings.length,
        due: dueBookings.reduce((s, b) => s + totals(b).remaining, 0),
        revenueToday,
      },
    };
  }, [bookings, stations, rules, q, now, today]);

  const { stats } = data;
  const tiles = [
    ["Active sessions", String(stats.active), stats.active ? "text-ember" : ""],
    ["Upcoming today", String(stats.upcomingToday), ""],
    ["PS5 available", `${stats.free}/${stations.filter((s) => s.type === "ps5").length}`, stats.free ? "text-ok" : "text-bad"],
    ["Payments due", stats.dueCount ? `${fmtINR(stats.due)}` : "None", stats.dueCount ? "text-warn" : "text-ok"],
    ["Today's revenue", fmtINR(stats.revenueToday), ""],
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="display mt-1 text-5xl sm:text-6xl">Today's overview</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setPricing(true)}><IndianRupee className="size-4" /> Pricing</button>
          <button type="button" className="btn btn-primary hidden md:inline-flex" onClick={() => setAdding(true)}><Plus className="size-5" /> Add Booking</button>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map(([l, v, c], i) => (
          <div key={l} className={`card px-4 py-4 ${i === 4 ? "col-span-2 lg:col-span-1" : ""}`}>
            <dt className="text-xs font-semibold uppercase tracking-widest text-mute">{l}</dt>
            <dd className={`display mt-1 text-4xl sm:text-5xl ${c}`}>{v}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10" aria-label="Station status">
        <h2 className="display mb-4 text-4xl">Stations</h2>
        <StationManager />
      </section>

      <div className="relative mt-10">
        <label htmlFor="adm-q" className="sr-only">Search bookings</label>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mute" aria-hidden />
        <input id="adm-q" type="search" className="input pl-12" placeholder="Search name, phone, player or booking number" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Section title="Now playing" count={data.playing.length} empty="No active sessions. Start one from an upcoming booking.">
        {data.playing.map((b) => <BookingCard key={b.id} booking={b} />)}
      </Section>
      {data.ended.length > 0 && (
        <Section title="Ended · collect payment" count={data.ended.length} empty="">
          {data.ended.map((b) => <BookingCard key={b.id} booking={b} />)}
        </Section>
      )}
      <Section title="Upcoming bookings" count={data.upcoming.length} empty="No upcoming bookings. Add one when a customer calls or walks in.">
        {data.upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
      </Section>

      <button type="button" onClick={() => setAdding(true)} aria-label="Add booking"
        className="btn btn-primary btn-lg fixed bottom-[4.9rem] right-4 z-30 shadow-2xl shadow-black/60 md:hidden">
        <CalendarPlus className="size-5" /> Add Booking
      </button>

      {adding && <BookingFormModal mode="add" onClose={() => setAdding(false)} />}
      {pricing && <PricingModal onClose={() => setPricing(false)} />}
    </>
  );
}
