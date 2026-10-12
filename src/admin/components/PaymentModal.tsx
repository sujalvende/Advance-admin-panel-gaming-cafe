import { useState } from "react";
import { api } from "../../lib/api";
import type { Booking } from "../../lib/types";
import { useDb } from "../../lib/store";
import { allPlayersPaymentInfo, bookingTotals } from "../../lib/pricing";
import { fmtINR } from "../../lib/time";
import { BusyButton, Modal, useBusy } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";

type PayMethod = "online" | "offline" | "both";

export default function PaymentModal({
  booking,
  initialPlayerId = null,
  onClose,
}: {
  booking: Booking;
  initialPlayerId?: string | null;
  onClose: () => void;
}) {
  const { rules, stations } = useDb();
  const { toast, fromError } = useToast();
  const [busy, run] = useBusy();
  const now = Date.now();
  const t = bookingTotals(booking, rules, stations, now);
  const playerInfos = allPlayersPaymentInfo(booking, rules, stations, now);

  const [targetId, setTargetId] = useState<string | "group">(
    initialPlayerId && booking.players.some((p) => p.id === initialPlayerId)
      ? initialPlayerId
      : "group",
  );

  const [method, setMethod] = useState<PayMethod | "">("");
  const [online, setOnline] = useState("");
  const [offline, setOffline] = useState("");
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [methodError, setMethodError] = useState(false);

  // Compute bill, paid, and remaining based on whether group or specific player is targeted
  const isPlayerTarget = targetId !== "group";
  const targetPlayer = isPlayerTarget ? booking.players.find((p) => p.id === targetId) : null;
  const targetPlayerInfo = targetPlayer ? playerInfos.get(targetPlayer.id) : null;

  const billTotal = isPlayerTarget ? targetPlayerInfo?.charge ?? 0 : t.total;
  const paidSoFar = isPlayerTarget ? targetPlayerInfo?.allocated ?? 0 : t.paid;
  const remainingDue = isPlayerTarget ? targetPlayerInfo?.remaining ?? 0 : t.remaining;

  const on = Number(online) || 0;
  const off = Number(offline) || 0;

  // Which amounts are active depends on the method
  const activeOnline = method === "online" || method === "both" ? on : 0;
  const activeOffline = method === "offline" || method === "both" ? off : 0;
  const entered = activeOnline + activeOffline;

  const left = Math.max(0, remainingDue - entered);
  const over = entered > remainingDue && remainingDue > 0;

  // Fill rest helpers
  const fillRest = (kind: "online" | "offline") => {
    const other = kind === "online" ? activeOffline : activeOnline;
    const fill = String(Math.max(0, remainingDue - other));
    if (kind === "online") setOnline(fill);
    else setOffline(fill);
  };

  function handleMethodChange(m: PayMethod) {
    setMethod(m);
    setMethodError(false);
    if (m === "online") setOffline("");
    if (m === "offline") setOnline("");
  }

  function handleTargetChange(newTarget: string | "group") {
    setTargetId(newTarget);
    setOnline("");
    setOffline("");
  }

  function save() {
    // Validate method is selected
    if (!method) {
      setMethodError(true);
      return;
    }
    // Validate amounts
    if (entered <= 0) return;

    run(async () => {
      try {
        await api.addPayment(booking.id, {
          online: activeOnline,
          offline: activeOffline,
          reference: ref,
          notes,
          playerId: isPlayerTarget ? targetId : null,
        });
        toast(
          "success",
          isPlayerTarget
            ? `Payment added for ${targetPlayer?.name}`
            : "Payment added for booking",
        );
        onClose();
      } catch (e) {
        fromError(e, "Couldn't save the payment.");
      }
    });
  }

  const canSubmit = !!method && entered > 0 && !over;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add payment"
      subtitle={`Booking #${booking.no} · ${booking.customerName}`}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <BusyButton busy={busy} disabled={!canSubmit} onClick={save}>
            Save payment
          </BusyButton>
        </>
      }
    >
      {/* Target selection if multiple players */}
      {booking.players.length > 1 && (
        <div className="mb-4">
          <label className="label" htmlFor="pay-target">
            Apply payment to
          </label>
          <select
            id="pay-target"
            className="input"
            value={targetId}
            onChange={(e) => handleTargetChange(e.target.value)}
          >
            <option value="group">Entire booking (Group total · ₹{t.remaining} due)</option>
            {booking.players.map((p) => {
              const info = playerInfos.get(p.id);
              const pDue = info?.remaining ?? 0;
              return (
                <option key={p.id} value={p.id}>
                  {p.name} ({pDue > 0 ? `₹${pDue} due` : "Fully paid"})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Bill summary cards for selected target */}
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Bill", fmtINR(billTotal)],
          ["Paid so far", fmtINR(paidSoFar)],
          ["Due", fmtINR(remainingDue)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-panel2 p-3">
            <dt className="text-xs text-mute">{l}</dt>
            <dd className="font-mono text-xl font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      {/* MANDATORY: Payment method selector */}
      <div className="mt-5">
        <label className="label">
          Payment method <span className="text-bad">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["online", "offline", "both"] as PayMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleMethodChange(m)}
              className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-all ${
                method === m
                  ? "border-ember bg-ember/15 text-ember"
                  : "border-line text-mute hover:border-ember/50 hover:text-bone"
              }`}
            >
              {m === "online" ? "Online / UPI" : m === "offline" ? "Cash" : "Both"}
            </button>
          ))}
        </div>
        {methodError && (
          <p className="mt-2 text-sm text-bad" role="alert">
            Please select a payment method.
          </p>
        )}
      </div>

      {/* Amount fields — shown based on selected method */}
      {method && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(method === "online" || method === "both") && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label !mb-0" htmlFor="pay-on">
                  Online / UPI (₹)
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-ember"
                  onClick={() => fillRest("online")}
                >
                  Fill rest · {fmtINR(Math.max(0, remainingDue - (method === "both" ? activeOffline : 0)))}
                </button>
              </div>
              <input
                id="pay-on"
                data-autofocus
                className="input font-mono"
                type="number"
                inputMode="decimal"
                min={0}
                value={online}
                onChange={(e) => setOnline(e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          {(method === "offline" || method === "both") && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label !mb-0" htmlFor="pay-off">
                  Cash (₹)
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-ember"
                  onClick={() => fillRest("offline")}
                >
                  Fill rest · {fmtINR(Math.max(0, remainingDue - (method === "both" ? activeOnline : 0)))}
                </button>
              </div>
              <input
                id="pay-off"
                className="input font-mono"
                type="number"
                inputMode="decimal"
                min={0}
                value={offline}
                onChange={(e) => setOffline(e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="label" htmlFor="pay-ref">
              Reference / transaction ID
            </label>
            <input
              id="pay-ref"
              className="input"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder={
                method === "online"
                  ? "UPI ref / transaction ID (optional)"
                  : "Receipt no. (optional)"
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="pay-notes">
              Notes
            </label>
            <input
              id="pay-notes"
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Live payment preview */}
      {method && (
        <div className="mt-5 rounded-2xl border border-line p-4" aria-live="polite">
          {method === "both" && (
            <div className="mb-2 grid grid-cols-2 gap-2 border-b border-line pb-2 text-sm">
              <span className="text-mute">Online</span>
              <b className="text-right font-mono">{fmtINR(activeOnline)}</b>
              <span className="text-mute">Cash</span>
              <b className="text-right font-mono">{fmtINR(activeOffline)}</b>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-mute">Total paid after this</span>
            <b className="font-mono">{fmtINR(paidSoFar + entered)}</b>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-mute">Remaining</span>
            <b
              className={`font-mono ${over ? "text-bad" : left > 0 ? "text-warn" : "text-ok"}`}
            >
              {over ? `Over by ${fmtINR(entered - remainingDue)}` : fmtINR(left)}
            </b>
          </div>
          {left === 0 && !over && entered > 0 && (
            <p className="mt-2 rounded-xl bg-ok/10 px-3 py-2 text-sm font-semibold text-ok">
              ✓ Fully paid — will be marked PAID
            </p>
          )}
        </div>
      )}

      {t.paid > 0 && !booking.refunded && booking.status !== "completed" && (
        <button
          type="button"
          className="mt-4 text-sm text-mute underline hover:text-bone"
          onClick={() =>
            run(async () => {
              try {
                await api.markRefunded(booking.id);
                toast("success", "Marked as refunded");
                onClose();
              } catch (e) {
                fromError(e);
              }
            })
          }
        >
          Mark this booking as refunded
        </button>
      )}
    </Modal>
  );
}
