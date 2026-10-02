import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { api, type BookingInput } from "../../lib/api";
import { findConflicts, endClock } from "../../lib/conflicts";
import { useDb } from "../../lib/store";
import type { Booking, BookingSource, BookingStatus } from "../../lib/types";
import { SOURCE_LABEL, STATUS_LABEL } from "../../lib/types";
import { fmtTime, todayStr } from "../../lib/time";
import { BusyButton, Modal, useBusy } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";

export type FormMode = "add" | "edit" | "reschedule";

export default function BookingFormModal({ mode, booking, onClose }: { mode: FormMode; booking?: Booking; onClose: () => void }) {
  const { stations, games, bookings } = useDb();
  const { toast, fromError } = useToast();
  const [busy, run] = useBusy();
  const [override, setOverride] = useState(false);
  const [f, setF] = useState({
    customerName: booking?.customerName ?? "", phone: booking?.phone ?? "", whatsapp: booking?.whatsapp ?? "",
    email: booking?.email ?? "", date: booking?.date ?? todayStr(),
    startTime: booking?.startTime ?? new Date().toTimeString().slice(0, 5),
    durationMin: booking?.durationMin ?? 60, stationId: booking?.stationId ?? "ps5-1", gameId: booking?.gameId ?? "",
    playerCount: booking?.players.length ?? 1, notes: booking?.notes ?? "",
    source: (booking?.source ?? "walkin") as BookingSource, status: (booking?.status ?? "confirmed") as BookingStatus,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const conflicts = useMemo(
    () => findConflicts(bookings, { id: booking?.id, stationId: f.stationId, date: f.date, startTime: f.startTime, durationMin: f.durationMin }),
    [bookings, booking?.id, f.stationId, f.date, f.startTime, f.durationMin],
  );
  const freeAlt = stations.filter((s) => s.type !== "vr" && s.id !== f.stationId && !["disabled", "maintenance"].includes(s.status) &&
    !findConflicts(bookings, { id: booking?.id, stationId: s.id, date: f.date, startTime: f.startTime, durationMin: f.durationMin }).length);

  const title = mode === "add" ? "Add booking" : mode === "edit" ? "Edit booking" : "Reschedule";
  const full = mode !== "reschedule";
  const isLiveSession = booking?.status === "playing";

  function save() {
    run(async () => {
      try {
        const input: BookingInput & { status: BookingStatus } = { ...f };
        if (mode === "add") {
          await api.createBooking(input, { allowConflict: override });
          toast("success", "Booking created");
        } else {
          await api.updateBooking(booking!.id, input, { allowConflict: override });
          toast("success", mode === "reschedule" ? "Booking updated" : "Booking updated");
        }
        onClose();
      } catch (e) { fromError(e, "Failed to save booking."); }
    });
  }

  return (
    <Modal open onClose={onClose} wide title={title} subtitle={booking ? `#${booking.no} · ${booking.customerName}` : "Phone, WhatsApp or walk-in"}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <BusyButton busy={busy} onClick={save} disabled={conflicts.length > 0 && !override}>{mode === "add" ? "Create booking" : "Save changes"}</BusyButton>
      </>}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
        {full && (<>
          <div><label className="label" htmlFor="bm-name">Customer name</label>
            <input id="bm-name" data-autofocus className="input" value={f.customerName} onChange={(e) => set("customerName", e.target.value)} required /></div>
          <div><label className="label" htmlFor="bm-phone">Phone</label>
            <input id="bm-phone" type="tel" inputMode="tel" className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} required /></div>
        </>)}
        <div><label className="label" htmlFor="bm-date">Date</label>
          <input id="bm-date" type="date" className="input" value={f.date} onChange={(e) => set("date", e.target.value)} /></div>
        <div><label className="label" htmlFor="bm-time">Start time</label>
          <input id="bm-time" type="time" className="input" value={f.startTime} onChange={(e) => set("startTime", e.target.value)} /></div>
        <div><label className="label" htmlFor="bm-dur">Duration (minutes)</label>
          <input id="bm-dur" type="number" min={10} step={5} className="input" value={f.durationMin} onChange={(e) => set("durationMin", Number(e.target.value))} /></div>
        <div><label className="label" htmlFor="bm-pc">Players</label>
          <input id="bm-pc" type="number" min={1} max={12} className="input" value={f.playerCount} onChange={(e) => set("playerCount", Number(e.target.value))} disabled={isLiveSession && !!booking?.sessionEndedAt} /></div>
        <div><label className="label" htmlFor="bm-st">Station</label>
          <select id="bm-st" className="input" value={f.stationId} onChange={(e) => set("stationId", e.target.value)}>
            {stations.filter((s) => s.type !== "vr").map((s) => <option key={s.id} value={s.id}>{s.name.replace(" · ", " ")}</option>)}</select></div>
        <div><label className="label" htmlFor="bm-game">Game</label>
          <select id="bm-game" className="input" value={f.gameId} onChange={(e) => set("gameId", e.target.value)}>
            <option value="">Not decided</option>
            {games.filter((g) => g.active).map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></div>

        {conflicts.length > 0 && (
          <div className="rounded-2xl border border-warn/40 bg-warn/10 p-4 sm:col-span-2" role="alert">
            <p className="flex items-center gap-2 font-semibold text-warn"><TriangleAlert className="size-4" /> Station conflict</p>
            <p className="mt-1 text-sm text-bone/80">
              Overlaps with {conflicts.map((c) => `#${c.no} ${c.customerName} (${fmtTime(c.startTime)}–${fmtTime(endClock(c))})`).join(", ")}.
            </p>
            {freeAlt.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-mute">Free at this time:</span>
                {freeAlt.map((s) => <button key={s.id} type="button" className="btn btn-soft btn-sm" onClick={() => set("stationId", s.id)}>{s.name.replace(" · ", " ")}</button>)}
              </div>
            )}
            <label className="mt-3 flex min-h-10 cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" className="size-5 accent-[var(--color-ember)]" checked={override} onChange={(e) => setOverride(e.target.checked)} />
              Book anyway (intentional override)
            </label>
          </div>
        )}

        {full && (<>
          <div><label className="label" htmlFor="bm-src">Source</label>
            <select id="bm-src" className="input" value={f.source} onChange={(e) => set("source", e.target.value as BookingSource)}>
              {Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="label" htmlFor="bm-status">Status</label>
            <select id="bm-status" className="input" value={f.status} onChange={(e) => set("status", e.target.value as BookingStatus)}>
              {Object.entries(STATUS_LABEL).filter(([k]) => k !== "completed" && (k !== "playing" || booking?.status === "playing")).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="label" htmlFor="bm-wa">WhatsApp</label>
            <input id="bm-wa" type="tel" className="input" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
          <div><label className="label" htmlFor="bm-em">Email</label>
            <input id="bm-em" type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="bm-notes">Notes</label>
            <textarea id="bm-notes" className="input min-h-20" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
        </>)}
        <button type="submit" className="sr-only">Save</button>
      </form>
    </Modal>
  );
}
