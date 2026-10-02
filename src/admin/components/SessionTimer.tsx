import { useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Booking } from "../../lib/types";
import { api } from "../../lib/api";
import { useNow } from "../../lib/store";
import { fmtClock, fmtHMS } from "../../lib/time";
import { useToast } from "../../components/ui/Toast";
import { Spinner } from "../../components/ui/Modal";

export function elapsedMs(b: Booking, now: number) {
  if (!b.sessionStartedAt) return 0;
  const end = b.sessionEndedAt ? Date.parse(b.sessionEndedAt) : b.pausedAt ? Date.parse(b.pausedAt) : now;
  return end - Date.parse(b.sessionStartedAt) - b.pausedMs;
}

export default function SessionTimer({ booking }: { booking: Booking }) {
  const now = useNow(1000);
  const { fromError } = useToast();
  const [busy, setBusy] = useState(false);
  const paused = !!booking.pausedAt;

  async function toggle() {
    setBusy(true);
    try {
      await (paused ? api.resumeSession(booking.id) : api.pauseSession(booking.id));
    } catch (e) {
      fromError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3">
      <div>
        <p className="font-mono text-3xl font-semibold tabular-nums leading-none sm:text-4xl" aria-label="Session elapsed time">
          {fmtHMS(elapsedMs(booking, now))}
        </p>
        <p className="mt-1.5 text-xs text-mute">
          Started {fmtClock(booking.sessionStartedAt)} {paused && <b className="ml-1 text-warn">· Paused</b>}
        </p>
      </div>
      <button type="button" onClick={toggle} disabled={busy} className="btn btn-soft" aria-label={paused ? "Resume session" : "Pause session"}>
        {busy ? <Spinner /> : paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        {paused ? "Resume" : "Pause"}
      </button>
    </div>
  );
}
