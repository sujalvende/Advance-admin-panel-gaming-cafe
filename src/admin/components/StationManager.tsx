import { useState } from "react";
import { api } from "../../lib/api";
import { useDb } from "../../lib/store";
import { STATION_STATUS_LABEL, type StationStatus } from "../../lib/types";
import StationPill from "../../components/ui/StationPill";
import { useToast } from "../../components/ui/Toast";
import { Spinner } from "../../components/ui/Modal";

const OPTIONS: StationStatus[] = ["available", "booked", "playing", "maintenance", "disabled"];

export default function StationManager() {
  const { stations } = useDb();
  const { toast, fromError } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function change(id: string, status: StationStatus) {
    setBusyId(id);
    try { await api.setStationStatus(id, status); toast("success", "Station updated"); } catch (e) { fromError(e); } finally { setBusyId(null); }
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {stations.map((s) => (
        <li key={s.id} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold leading-tight">{s.name.replace(" · ", " ")}</h3>
            {busyId === s.id && <Spinner />}
          </div>
          <div className="mt-2"><StationPill status={s.status} /></div>
          <label className="label mt-4" htmlFor={`st-${s.id}`}>Set status</label>
          <select id={`st-${s.id}`} className="input" value={s.status} disabled={busyId === s.id || s.type === "vr"} onChange={(e) => change(s.id, e.target.value as StationStatus)}>
            {OPTIONS.map((o) => <option key={o} value={o}>{STATION_STATUS_LABEL[o]}</option>)}
          </select>
        </li>
      ))}
    </ul>
  );
}
