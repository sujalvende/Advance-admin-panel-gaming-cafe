import { useState } from "react";
import { api } from "../../lib/api";
import { useDb } from "../../lib/store";
import type { PricingRule } from "../../lib/types";
import { BusyButton, Modal, useBusy } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";

export default function PricingModal({ onClose }: { onClose: () => void }) {
  const { rules } = useDb();
  const [draft, setDraft] = useState<PricingRule[]>(() => structuredClone(rules.filter((r) => r.stationType !== "vr")));
  const [busy, run] = useBusy();
  const { toast, fromError } = useToast();
  const upd = (id: string, p: Partial<PricingRule>) => setDraft((d) => d.map((r) => (r.id === id ? { ...r, ...p } : r)));

  return (
    <Modal open onClose={onClose} wide title="Pricing" subtitle="Rates are per player. These drive every suggested amount and the public pricing section."
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <BusyButton busy={busy} onClick={() => run(async () => {
          try { await api.savePricing([...draft, ...rules.filter((r) => r.stationType === "vr")]); toast("success", "Pricing saved"); onClose(); } catch (e) { fromError(e); }
        })}>Save pricing</BusyButton>
      </>}>
      <div className="space-y-6">
        {draft.map((r) => (
          <fieldset key={r.id} className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-2">
            <legend className="px-2 font-bold">{r.label}</legend>
            <div><label className="label" htmlFor={`${r.id}-rate`}>Rate (₹ / hour)</label>
              <input id={`${r.id}-rate`} type="number" min={0} className="input" value={r.rate} onChange={(e) => upd(r.id, { rate: Number(e.target.value) })} /></div>
            <div><label className="label" htmlFor={`${r.id}-unit`}>Billing</label>
              <select id={`${r.id}-unit`} className="input" value={r.unit} onChange={(e) => upd(r.id, { unit: e.target.value as PricingRule["unit"] })}>
                <option value="hour">Per minute (pro-rata)</option><option value="half_hour">Per 30-min block</option></select></div>
            <div><label className="label" htmlFor={`${r.id}-min`}>Minimum billed (min)</label>
              <input id={`${r.id}-min`} type="number" min={0} className="input" value={r.minMinutes} onChange={(e) => upd(r.id, { minMinutes: Number(e.target.value) })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor={`${r.id}-g`}>Group rate</label>
                <input id={`${r.id}-g`} type="number" min={0} className="input" placeholder="none" value={r.groupRate ?? ""} onChange={(e) => upd(r.id, { groupRate: e.target.value === "" ? null : Number(e.target.value) })} /></div>
              <div><label className="label" htmlFor={`${r.id}-gp`}>From players</label>
                <input id={`${r.id}-gp`} type="number" min={2} className="input" value={r.groupMinPlayers} onChange={(e) => upd(r.id, { groupMinPlayers: Number(e.target.value) })} /></div>
            </div>
          </fieldset>
        ))}
      </div>
    </Modal>
  );
}
