import { useState } from "react";
import { api } from "../../lib/api";
import type { Booking, Player } from "../../lib/types";
import { useDb } from "../../lib/store";
import { fromLocalInput, toLocalInput } from "../../lib/time";
import { calcAmount, playerMinutes, ruleFor } from "../../lib/pricing";
import { BusyButton, Modal, useBusy } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { fmtINR, fmtDur } from "../../lib/time";

export default function PlayerModal({ booking, player, onClose }: { booking: Booking; player: Player | null; onClose: () => void }) {
  const { rules, stations } = useDb();
  const { toast, fromError } = useToast();
  const [busy, run] = useBusy();
  const editing = !!player;
  const [name, setName] = useState(player?.name ?? "");
  const [start, setStart] = useState(toLocalInput(player?.startTime ?? null));
  const [end, setEnd] = useState(toLocalInput(player?.endTime ?? null));
  const [planned, setPlanned] = useState(player?.plannedMinutes?.toString() ?? "");
  const [amount, setAmount] = useState(player?.overridden ? String(player.amount) : "");
  const [payStatus, setPayStatus] = useState(player?.paymentStatus ?? "unpaid");
  const [payMethod, setPayMethod] = useState(player?.paymentMethod ?? "");
  const [notes, setNotes] = useState(player?.notes ?? "");

  const type = stations.find((s) => s.id === booking.stationId)?.type ?? "ps5";
  const draft: Player = {
    ...(player ?? ({ id: "", overridden: false, rate: null, amount: null } as Player)),
    startTime: fromLocalInput(start), endTime: fromLocalInput(end),
    plannedMinutes: planned ? Number(planned) : null,
  };
  const mins = playerMinutes(booking, draft, Date.now());
  const suggested = calcAmount(mins, ruleFor(rules, type), booking.players.length + (editing ? 0 : 1));

  function save() {
    run(async () => {
      try {
        if (!editing) {
          await api.addPlayer(booking.id, name);
          toast("success", "Player added");
        } else {
          await api.updatePlayer(booking.id, player!.id, {
            name: name.trim() || player!.name,
            startTime: draft.startTime, endTime: draft.endTime, plannedMinutes: draft.plannedMinutes,
            paymentStatus: payStatus, paymentMethod: payMethod ? (payMethod as "online" | "offline") : null,
            notes, amountInput: amount === "" ? null : Number(amount),
          });
          toast("success", "Player updated");
        }
        onClose();
      } catch (e) { fromError(e, "Couldn't save the player."); }
    });
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Edit player" : "Add player"}
      subtitle={`Booking #${booking.no} · ${booking.customerName}`}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <BusyButton busy={busy} onClick={save}>{editing ? "Save player" : "Add player"}</BusyButton>
      </>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="pm-name">Player name</label>
          <input id="pm-name" data-autofocus className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Player ${booking.players.length + 1}`} />
        </div>
        {editing && (
          <>
            <div><label className="label" htmlFor="pm-start">Start</label>
              <input id="pm-start" type="datetime-local" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><label className="label" htmlFor="pm-end">End</label>
              <input id="pm-end" type="datetime-local" className="input" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
            {!start && (
              <div><label className="label" htmlFor="pm-plan">Planned minutes</label>
                <input id="pm-plan" type="number" min={1} className="input" value={planned} onChange={(e) => setPlanned(e.target.value)} placeholder={String(booking.durationMin)} /></div>
            )}
            <div>
              <label className="label" htmlFor="pm-amt">Amount override (₹)</label>
              <input id="pm-amt" type="number" min={0} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Auto · ${suggested}`} />
            </div>
            <div><label className="label" htmlFor="pm-ps">Payment status</label>
              <select id="pm-ps" className="input" value={payStatus} onChange={(e) => setPayStatus(e.target.value as "paid" | "unpaid")}>
                <option value="unpaid">Unpaid</option><option value="paid">Paid</option></select></div>
            <div><label className="label" htmlFor="pm-pm">Payment method</label>
              <select id="pm-pm" className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="">—</option><option value="online">Online</option><option value="offline">Cash</option></select></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="pm-n">Notes</label>
              <input id="pm-n" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <div className="rounded-2xl bg-panel2 p-4 sm:col-span-2">
              <p className="text-sm text-mute">Duration <b className="text-bone">{fmtDur(mins)}</b> · Suggested amount <b className="text-ember">{fmtINR(suggested)}</b></p>
              <p className="mt-1 text-xs text-mute">Leave the override empty to use the pricing rules.</p>
            </div>
          </>
        )}
        {!editing && <p className="text-sm text-mute sm:col-span-2">{booking.sessionStartedAt ? "The timer starts for this player right now." : "Their timer starts with the session."} You can fine-tune times afterwards.</p>}
      </div>
    </Modal>
  );
}
