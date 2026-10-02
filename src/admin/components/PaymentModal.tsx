import { useState } from "react";
import { api } from "../../lib/api";
import type { Booking } from "../../lib/types";
import { useDb } from "../../lib/store";
import { bookingTotals } from "../../lib/pricing";
import { fmtINR } from "../../lib/time";
import { BusyButton, Modal, useBusy } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";

export default function PaymentModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { rules, stations } = useDb();
  const { toast, fromError } = useToast();
  const [busy, run] = useBusy();
  const t = bookingTotals(booking, rules, stations, Date.now());
  const [online, setOnline] = useState("");
  const [offline, setOffline] = useState("");
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const on = Number(online) || 0;
  const off = Number(offline) || 0;
  const entered = on + off;
  const left = Math.max(0, t.remaining - entered);
  const over = entered > t.remaining && t.total > 0;

  const fillRest = (kind: "online" | "offline") => (kind === "online" ? setOnline : setOffline)(String(Math.max(0, t.remaining - (kind === "online" ? off : on))));

  function save() {
    run(async () => {
      try {
        await api.addPayment(booking.id, { online: on, offline: off, reference: ref, notes });
        toast("success", "Payment added");
        onClose();
      } catch (e) { fromError(e, "Couldn't save the payment."); }
    });
  }

  return (
    <Modal open onClose={onClose} title="Add payment" subtitle={`Booking #${booking.no} · ${booking.customerName}`}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <BusyButton busy={busy} disabled={entered <= 0 || over} onClick={save}>Save payment</BusyButton>
      </>}>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[["Bill", fmtINR(t.total)], ["Paid so far", fmtINR(t.paid)], ["Due", fmtINR(t.remaining)]].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-panel2 p-3"><dt className="text-xs text-mute">{l}</dt><dd className="font-mono text-xl font-semibold">{v}</dd></div>
        ))}
      </dl>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between"><label className="label !mb-0" htmlFor="pay-on">Online (₹)</label>
            <button type="button" className="text-xs font-semibold text-ember" onClick={() => fillRest("online")}>Fill rest</button></div>
          <input id="pay-on" data-autofocus className="input font-mono" type="number" inputMode="decimal" min={0} value={online} onChange={(e) => setOnline(e.target.value)} placeholder="0" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between"><label className="label !mb-0" htmlFor="pay-off">Cash / offline (₹)</label>
            <button type="button" className="text-xs font-semibold text-ember" onClick={() => fillRest("offline")}>Fill rest</button></div>
          <input id="pay-off" className="input font-mono" type="number" inputMode="decimal" min={0} value={offline} onChange={(e) => setOffline(e.target.value)} placeholder="0" />
        </div>
        <div className="sm:col-span-2"><label className="label" htmlFor="pay-ref">Reference / transaction ID</label>
          <input id="pay-ref" className="input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UPI ref (optional)" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="pay-notes">Notes</label>
          <input id="pay-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>
      <div className="mt-5 rounded-2xl border border-line p-4" aria-live="polite">
        <div className="flex justify-between"><span className="text-mute">Total paid after this</span><b className="font-mono">{fmtINR(t.paid + entered)}</b></div>
        <div className="mt-1 flex justify-between"><span className="text-mute">Remaining</span>
          <b className={`font-mono ${over ? "text-bad" : left > 0 ? "text-warn" : "text-ok"}`}>{over ? `Over by ${fmtINR(entered - t.remaining)}` : fmtINR(left)}</b></div>
      </div>
      {t.paid > 0 && !booking.refunded && booking.status !== "completed" && (
        <button type="button" className="mt-4 text-sm text-mute underline hover:text-bone" onClick={() => run(async () => { try { await api.markRefunded(booking.id); toast("success", "Marked as refunded"); onClose(); } catch (e) { fromError(e); } })}>
          Mark this booking as refunded
        </button>
      )}
    </Modal>
  );
}
