import { useState } from "react";
import { Plus } from "lucide-react";
import type { Booking, Player } from "../../lib/types";
import { api } from "../../lib/api";
import { useToast } from "../../components/ui/Toast";
import PlayerRow from "./PlayerRow";
import PlayerModal from "./PlayerModal";

export default function PlayerList({ booking }: { booking: Booking }) {
  const { toast, fromError } = useToast();
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<{ player: Player | null } | null>(null);
  const locked = booking.status === "completed";
  const canAdd = !locked && !booking.sessionEndedAt;

  async function act(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    try { await fn(); toast("success", ok); } catch (e) { fromError(e); } finally { setBusy(false); }
  }

  return (
    <section aria-label={`Players for booking ${booking.no}`}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-mono text-xs uppercase tracking-[0.16em] text-mute">Players · {booking.players.length}</h4>
        {canAdd && (
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setModal({ player: null })}><Plus className="size-4" /> Add player</button>
        )}
      </div>
      <ul className="grid gap-2 lg:grid-cols-2">
        {booking.players.map((p, i) => (
          <PlayerRow key={p.id} booking={booking} player={p} index={i} locked={locked} busy={busy}
            onEdit={() => setModal({ player: p })}
            onStop={() => act(() => api.endPlayer(booking.id, p.id), `${p.name} stopped`)}
            onRemove={() => act(() => api.removePlayer(booking.id, p.id), "Player removed")} />
        ))}
      </ul>
      {modal && <PlayerModal booking={booking} player={modal.player} onClose={() => setModal(null)} />}
    </section>
  );
}
