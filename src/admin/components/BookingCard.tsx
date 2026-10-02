import { useState } from "react";
import { CalendarClock, ChevronDown, Gamepad2, Lock, Pencil, Play, Square, Trash2, UserX, Users, Wallet, CheckCircle2, Phone, Clock } from "lucide-react";
import type { Booking } from "../../lib/types";
import { SOURCE_LABEL } from "../../lib/types";
import { api } from "../../lib/api";
import { useDb, useNow } from "../../lib/store";
import { bookingTotals } from "../../lib/pricing";
import { endClock } from "../../lib/conflicts";
import { fmtDateLabel, fmtINR, fmtTime, toMs } from "../../lib/time";
import StatusBadge, { PayBadge } from "./StatusBadge";
import SessionTimer from "./SessionTimer";
import PlayerList from "./PlayerList";
import PaymentModal from "./PaymentModal";
import BookingFormModal, { type FormMode } from "./BookingFormModal";
import { BusyButton, ConfirmModal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";

type Confirm = "noshow" | "delete" | "end" | "submit" | null;

export default function BookingCard({ booking: b }: { booking: Booking }) {
  const { rules, stations, games } = useDb();
  const now = useNow(30000);
  const { toast, fromError } = useToast();
  const station = stations.find((s) => s.id === b.stationId);
  const game = games.find((g) => g.id === b.gameId);
  const t = bookingTotals(b, rules, stations, now);

  const running = b.status === "playing" && !b.sessionEndedAt;
  const ended = b.status === "playing" && !!b.sessionEndedAt;
  const done = b.status === "completed";
  const pre = ["pending", "confirmed", "delayed"].includes(b.status);
  const overdue = pre && toMs(b.date, b.startTime) + 15 * 60000 < now;

  const [open, setOpen] = useState(running || ended);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormMode | null>(null);
  const [pay, setPay] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  async function act(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try { await fn(); toast("success", ok); } catch (e) { fromError(e); } finally { setBusy(false); }
  }

  return (
    <article className={`card overflow-hidden ${running ? "border-ember/50" : ""} ${done ? "opacity-90" : ""}`} aria-label={`Booking ${b.no} for ${b.customerName}`}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-xl font-bold">{b.customerName}</h3>
              <span className="font-mono text-sm text-mute">#{b.no}</span>
            </div>
            <a href={`tel:${b.phone}`} className="mt-0.5 inline-flex min-h-8 items-center gap-1.5 text-sm text-mute hover:text-bone"><Phone className="size-3.5" aria-hidden />{b.phone}</a>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {overdue && <span className="rounded-full bg-bad/15 px-2.5 py-1 text-xs font-semibold text-bad">Overdue</span>}
            <StatusBadge booking={b} />
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <Meta icon={CalendarClock} label="When" value={`${fmtDateLabel(b.date)}`} />
          <Meta icon={Clock} label="Time" value={`${fmtTime(b.startTime)} – ${fmtTime(endClock(b))}`} />
          <Meta icon={Gamepad2} label="Station" value={station?.name.replace(" · ", " ") ?? "—"} />
          <Meta icon={Users} label="Players" value={`${b.players.length}`} />
          <Meta label="Game" value={game?.title ?? "Not decided"} />
          <Meta label="Source" value={SOURCE_LABEL[b.source]} />
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4" aria-label="Payment summary">
          {[
            ["Online", fmtINR(t.online), ""],
            ["Cash", fmtINR(t.offline), ""],
            ["Total", fmtINR(t.total), "text-bone"],
            ["Remaining", fmtINR(t.remaining), t.remaining > 0 ? "text-warn" : "text-ok"],
          ].map(([l, v, c]) => (
            <div key={l} className="bg-ink px-3.5 py-3">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-widest text-mute">{l}</dt>
              <dd className={`font-mono text-xl font-semibold tabular-nums ${c}`}>{v}</dd>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><PayBadge status={t.status} />{b.notes && <p className="text-sm text-mute">“{b.notes}”</p>}</div>

        {running && <div className="mt-4"><SessionTimer booking={b} /></div>}

        {done && (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-ok/10 px-4 py-3 text-sm text-ok">
            <Lock className="size-4" aria-hidden /> Finalized and stored in History{b.completedAt && ` · ${new Date(b.completedAt).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}`}
          </p>
        )}

        {/* Primary workflow actions */}
        {!done && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {b.status === "pending" && <BusyButton busy={busy} className="btn btn-primary btn-lg flex-1" onClick={() => act(() => api.setStatus(b.id, "confirmed"), "Booking confirmed")}><CheckCircle2 className="size-5" /> Confirm</BusyButton>}
            {pre && <BusyButton busy={busy} className={`btn btn-lg flex-1 ${b.status === "pending" ? "btn-soft" : "btn-primary"}`} onClick={() => act(() => api.startSession(b.id), "Session started")}><Play className="size-5" /> Start Session</BusyButton>}
            {running && <BusyButton busy={busy} className="btn btn-primary btn-lg flex-1" onClick={() => setConfirm("end")}><Square className="size-5" /> End Session</BusyButton>}
            {ended && (<>
              <button type="button" className="btn btn-primary btn-lg flex-1" onClick={() => setPay(true)}><Wallet className="size-5" /> Add Payment</button>
              <BusyButton busy={busy} className={`btn btn-lg flex-1 ${t.remaining <= 0 ? "btn-ok" : "btn-soft"}`} onClick={() => (t.remaining > 0 ? setConfirm("submit") : act(() => api.submit(b.id), "Session completed"))}>Submit</BusyButton>
            </>)}
          </div>
        )}
      </div>

      <div className="border-t border-line">
        <button type="button" className="flex min-h-12 w-full items-center justify-between px-4 text-sm font-semibold text-mute hover:text-bone sm:px-5" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          Players & actions
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="space-y-4 border-t border-line bg-panel2/40 p-4 sm:p-5">
            <PlayerList booking={b} />
            {!done && (
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button type="button" className="btn btn-ghost" onClick={() => setForm("edit")}><Pencil className="size-4" /> Edit</button>
                {!ended && <button type="button" className="btn btn-ghost" onClick={() => setForm("reschedule")}><CalendarClock className="size-4" /> Reschedule</button>}
                {b.status === "confirmed" && <BusyButton busy={busy} className="btn btn-ghost" onClick={() => act(() => api.setStatus(b.id, "delayed"), "Marked as delayed")}><Clock className="size-4" /> Delayed</BusyButton>}
                {pre && <button type="button" className="btn btn-ghost text-bad" onClick={() => setConfirm("noshow")}><UserX className="size-4" /> No Show</button>}
                {!running && <button type="button" className="btn btn-ghost text-bad" onClick={() => setConfirm("delete")}><Trash2 className="size-4" /> Delete</button>}
                {(running || ended) && <button type="button" className="btn btn-ghost" onClick={() => setPay(true)}><Wallet className="size-4" /> Add Payment</button>}
              </div>
            )}
          </div>
        )}
      </div>

      {form && <BookingFormModal mode={form} booking={b} onClose={() => setForm(null)} />}
      {pay && <PaymentModal booking={b} onClose={() => setPay(false)} />}
      <ConfirmModal open={confirm === "noshow"} onClose={() => setConfirm(null)} danger title="Mark as no show?" confirmLabel="Mark no show"
        body="The booking stays in your records so you can track lost bookings." onConfirm={async () => { await act(() => api.setStatus(b.id, "noshow"), "Marked as no show"); setConfirm(null); }} />
      <ConfirmModal open={confirm === "delete"} onClose={() => setConfirm(null)} danger title="Delete this booking?" confirmLabel="Delete"
        body="This removes it from active bookings. It is archived, not erased, so it can be restored from the database." onConfirm={async () => { await act(() => api.archive(b.id), "Booking deleted"); setConfirm(null); }} />
      <ConfirmModal open={confirm === "end"} onClose={() => setConfirm(null)} title="End this session?" confirmLabel="End session"
        body="Everyone still playing is stopped now and each player's charge is calculated. You can fix times afterwards." onConfirm={async () => { await act(() => api.endSession(b.id), "Session ended · add payment"); setConfirm(null); }} />
      <ConfirmModal open={confirm === "submit"} onClose={() => setConfirm(null)} title="Submit with a balance due?" confirmLabel="Submit anyway"
        body={`${fmtINR(t.remaining)} is still unpaid. The record is locked in History as partially paid.`} onConfirm={async () => { await act(() => api.submit(b.id), "Session completed"); setConfirm(null); }} />
    </article>
  );
}

function Meta({ icon: Icon, label, value }: { icon?: typeof Clock; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-widest text-mute">{Icon && <Icon className="size-3" aria-hidden />}{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
