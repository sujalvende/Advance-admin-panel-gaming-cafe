import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, MessageCircle, TriangleAlert } from "lucide-react";
import { BRAND } from "../../config/brand";
import { api, ApiError } from "../../lib/api";
import { findConflicts } from "../../lib/conflicts";
import { useDb } from "../../lib/store";
import { fmtDate, fmtTime, todayStr } from "../../lib/time";
import type { Booking } from "../../lib/types";
import { BusyButton } from "../ui/Modal";

const DURATIONS = [30, 60, 90, 120, 180, 240];

// Bug fix: correctly snap to the next 30-min slot
const nextSlot = () => {
  const d = new Date(Date.now() + 30 * 60000);
  const m = d.getMinutes();
  // snap up to next :00 or :30 boundary
  if (m <= 30) {
    d.setMinutes(30, 0, 0);
  } else {
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
  }
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const blank = () => ({
  name: "", phone: "", whatsapp: "", email: "", date: todayStr(), startTime: nextSlot(),
  durationMin: 60, players: 2, stationId: "any", gameId: "any", notes: "",
});

export default function BookingForm() {
  const { stations, games, bookings } = useDb();
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Booking | null>(null);
  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {};
      setDone(null);
      setF((x) => ({ ...x, ...(d.stationId ? { stationId: d.stationId } : {}), ...(d.gameId ? { gameId: d.gameId } : {}) }));
      // Scroll to form smoothly
      document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("booking:prefill", on);
    return () => window.removeEventListener("booking:prefill", on);
  }, []);

  const bookable = stations.filter((s) => s.type !== "vr" && s.status !== "disabled");
  const activeGames = games.filter((g) => g.active);

  const conflict = useMemo(() => {
    if (f.stationId === "any") return null;
    return findConflicts(bookings, { stationId: f.stationId, date: f.date, startTime: f.startTime, durationMin: f.durationMin })[0] ?? null;
  }, [bookings, f.stationId, f.date, f.startTime, f.durationMin]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    let stationId = f.stationId;
    if (stationId === "any") {
      const free = bookable.filter((s) => s.type === "ps5" && s.status !== "maintenance").find(
        (s) => !findConflicts(bookings, { stationId: s.id, date: f.date, startTime: f.startTime, durationMin: f.durationMin }).length,
      );
      if (!free) return setError("All PS5 stations are taken at that time. Try a different time.");
      stationId = free.id;
    }
    setBusy(true);
    try {
      const b = await api.createBooking({
        customerName: f.name, phone: f.phone, whatsapp: f.whatsapp, email: f.email, date: f.date,
        startTime: f.startTime, durationMin: f.durationMin, stationId, gameId: f.gameId === "any" ? "" : f.gameId,
        playerCount: f.players, notes: f.notes, source: "website",
      });
      setDone(b);
      setF(blank());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't send your booking. Please try again or message us on WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  const station = done && stations.find((s) => s.id === done.stationId);
  const waText = done
    ? `Hi ${BRAND.name}! Booking #${done.no} for ${fmtDate(done.date)} at ${fmtTime(done.startTime)}. Please confirm.`
    : "";

  return (
    <section id="book" className="relative border-t border-line bg-panel" aria-labelledby="book-h">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-32 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="reveal">
          <p className="eyebrow">Reserve</p>
          <h2 id="book-h" className="display mt-4 text-[clamp(3.5rem,10vw,7rem)]">
            Book your<br /><span className="text-ember">session.</span>
          </h2>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-mute">
            Send a request and we'll confirm it by phone or WhatsApp. Prefer talking? Reach us directly.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="btn btn-ghost">
              Call {BRAND.phone}
            </a>
            <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <MessageCircle className="size-4" aria-hidden /> WhatsApp us
            </a>
          </div>
        </div>

        {done ? (
          <div className="card p-8 sm:p-10" role="status">
            <CheckCircle2 className="size-12 text-ok" aria-hidden />
            <h3 className="display mt-5 text-5xl">Request received</h3>
            <p className="mt-2 text-mute">
              Booking <span className="font-mono text-bone">#{done.no}</span> · {fmtDate(done.date)} at {fmtTime(done.startTime)} · {station?.name.replace(" · ", " ")}
            </p>
            <p className="mt-4 text-mute">Status: <b className="text-warn">Pending</b>. We'll confirm shortly.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className="btn btn-primary">
                Confirm on WhatsApp
              </a>
              <button type="button" className="btn btn-ghost" onClick={() => setDone(null)}>Make another booking</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="card grid gap-x-5 gap-y-5 p-6 sm:grid-cols-2 sm:p-10" noValidate={false}>
            {/* Row 1: Name + Phone */}
            <div>
              <label className="label" htmlFor="bf-name">Name</label>
              <input id="bf-name" className="input" required autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="label" htmlFor="bf-phone">Phone number</label>
              <input id="bf-phone" className="input" required type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98765 43210" />
            </div>

            {/* Row 2: WhatsApp + Email */}
            <div>
              <label className="label" htmlFor="bf-wa">WhatsApp <span className="normal-case tracking-normal">(optional)</span></label>
              <input id="bf-wa" className="input" type="tel" inputMode="tel" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="If different from phone" />
            </div>
            <div>
              <label className="label" htmlFor="bf-email">Email <span className="normal-case tracking-normal">(optional)</span></label>
              <input id="bf-email" className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
            </div>

            {/* Row 3: Date + Time */}
            <div>
              <label className="label" htmlFor="bf-date">Date</label>
              <input id="bf-date" className="input" type="date" required min={todayStr()} value={f.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="bf-time">Start time</label>
              <input id="bf-time" className="input" type="time" required value={f.startTime} onChange={(e) => set("startTime", e.target.value)} />
            </div>

            {/* Row 4: Duration + Players */}
            <div>
              <label className="label" htmlFor="bf-dur">Estimated duration</label>
              <select id="bf-dur" className="input" value={f.durationMin} onChange={(e) => set("durationMin", Number(e.target.value))}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d < 60 ? `${d} minutes` : `${d / 60} hour${d > 60 ? "s" : ""}`}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="bf-players">Number of players</label>
              <input id="bf-players" className="input" type="number" min={1} max={12} required value={f.players} onChange={(e) => set("players", Number(e.target.value))} />
            </div>

            {/* Row 5: Station + Game */}
            <div>
              <label className="label" htmlFor="bf-station">Preferred station</label>
              <select id="bf-station" className="input" value={f.stationId} onChange={(e) => set("stationId", e.target.value)}>
                <option value="any">No preference (PS5)</option>
                {bookable.map((s) => <option key={s.id} value={s.id}>{s.name.replace(" · ", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="bf-game">Game</label>
              <select id="bf-game" className="input" value={f.gameId} onChange={(e) => set("gameId", e.target.value)}>
                <option value="any">Decide on the day</option>
                {activeGames.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>

            {/* Full-width: Notes */}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="bf-notes">Notes / special request</label>
              <textarea id="bf-notes" className="input min-h-24 resize-none" value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Birthday, tournament, controller preferences…" maxLength={500} />
            </div>

            {(conflict || error) && (
              <p className="flex items-start gap-2 rounded-2xl border border-warn/30 bg-warn/10 p-4 text-sm text-warn sm:col-span-2" role="alert">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error || "That station is already reserved around that time. Pick another station or time."}
              </p>
            )}

            <BusyButton busy={busy} disabled={!!conflict} type="submit" className="btn btn-primary btn-lg sm:col-span-2">
              {busy ? "Sending…" : "Request booking"}
            </BusyButton>
          </form>
        )}
      </div>
    </section>
  );
}
