import type { StationStatus } from "../../lib/types";
import { STATION_STATUS_LABEL } from "../../lib/types";

const tone: Record<StationStatus, string> = {
  available: "text-ok border-ok/30 bg-ok/10",
  playing: "text-bad border-bad/30 bg-bad/10",
  booked: "text-warn border-warn/30 bg-warn/10",
  maintenance: "text-info border-info/30 bg-info/10",
  disabled: "text-mute border-line bg-white/5",
};
const shape: Record<StationStatus, string> = {
  available: "rounded-full",
  playing: "rounded-full pulse-dot",
  booked: "rotate-45 rounded-[2px]",
  maintenance: "rounded-[2px]",
  disabled: "rounded-full opacity-50",
};

export default function StationPill({ status, label }: { status: StationStatus; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${tone[status]}`}>
      <span aria-hidden className={`size-2 bg-current ${shape[status]}`} />
      {label ?? STATION_STATUS_LABEL[status]}
    </span>
  );
}
