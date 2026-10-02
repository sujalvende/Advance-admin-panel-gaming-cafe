import { Ban, CheckCheck, CircleDashed, CircleDot, Clock, ThumbsUp, UserX, Wallet } from "lucide-react";
import type { Booking, PaymentStatus } from "../../lib/types";
import { STATUS_LABEL } from "../../lib/types";

type Key = Booking["status"] | "ended";
const cfg: Record<Key, { cls: string; Icon: typeof Clock; label?: string }> = {
  pending: { cls: "text-warn bg-warn/10 border-warn/30", Icon: CircleDashed },
  confirmed: { cls: "text-info bg-info/10 border-info/30", Icon: ThumbsUp },
  delayed: { cls: "text-orange-400 bg-orange-400/10 border-orange-400/30", Icon: Clock },
  playing: { cls: "text-ink bg-ember border-ember", Icon: CircleDot },
  ended: { cls: "text-ember bg-ember/10 border-ember/40", Icon: Wallet, label: "Ended · payment" },
  completed: { cls: "text-ok bg-ok/10 border-ok/30", Icon: CheckCheck },
  cancelled: { cls: "text-bad/80 bg-bad/10 border-bad/20", Icon: Ban },
  noshow: { cls: "text-bad bg-bad/10 border-bad/30", Icon: UserX },
};

export default function StatusBadge({ booking }: { booking: Pick<Booking, "status" | "sessionEndedAt"> }) {
  const key: Key = booking.status === "playing" && booking.sessionEndedAt ? "ended" : booking.status;
  const { cls, Icon, label } = cfg[key];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="size-3.5" aria-hidden />
      {label ?? STATUS_LABEL[booking.status]}
    </span>
  );
}

const payCfg: Record<PaymentStatus, string> = {
  unpaid: "text-bad bg-bad/10 border-bad/30",
  partial: "text-warn bg-warn/10 border-warn/30",
  paid: "text-ok bg-ok/10 border-ok/30",
  refunded: "text-mute bg-white/5 border-line",
};
export function PayBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${payCfg[status]}`}>{status}</span>
  );
}
