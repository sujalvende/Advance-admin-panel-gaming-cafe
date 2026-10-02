import { Gamepad2, Radio } from "lucide-react";
import { useDb, useNow } from "../../lib/store";
import type { Booking, Station } from "../../lib/types";
import { fmtClock, fmtDur, fmtTime, todayStr } from "../../lib/time";
import StationPill from "../ui/StationPill";

export const prefillBooking = (detail: { stationId?: string; gameId?: string }) =>
  window.dispatchEvent(new CustomEvent("booking:prefill", { detail }));

function detailFor(s: Station, bookings: Booking[], now: number) {
  if (s.type === "vr") return "Opening soon";
  if (s.status === "maintenance") return "Back shortly";
  if (s.status === "disabled") return "Currently closed";
  if (s.status === "playing") {
    const b = bookings.find((x) => x.stationId === s.id && x.status === "playing" && !x.sessionEndedAt);
    if (b?.sessionStartedAt) return `Session active · ${fmtDur((now - Date.parse(b.sessionStartedAt)) / 60000)} in`;
    return "Session active";
  }
  if (s.status === "booked") {
    const next = bookings
      .filter((x) => x.stationId === s.id && !x.deletedAt && ["pending", "confirmed", "delayed"].includes(x.status) && x.date === todayStr())
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
    return next ? `Reserved · ${fmtTime(next.startTime)}` : "Reserved";
  }
  return "Ready to play";
}

export function useStationRows() {
  const { stations, bookings } = useDb();
  const now = useNow(30000);
  return stations.map((s) => ({ s, detail: detailFor(s, bookings, now) }));
}

export default function Stations() {
  const rows = useStationRows();
  const live = rows.filter((r) => r.s.type !== "vr");

  return (
    <section id="stations" className="border-t border-line bg-panel" aria-labelledby="st-h">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-32">
        <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Stations</p>
            <h2 id="st-h" className="display mt-4 text-[clamp(3rem,10vw,7rem)]">
              Pick your<br />station.
            </h2>
          </div>
          <p className="max-w-sm leading-relaxed text-mute">
            Status updates live from the front desk. Grab a free station or reserve one for later.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.filter((r) => r.s.type === "ps5").map(({ s, detail }, i) => (
            <li key={s.id} className="reveal card group flex flex-col p-6 transition-all duration-300 hover:border-ember/40 hover:bg-panel2 hover:shadow-xl hover:shadow-black/40">
              <div className="flex items-start justify-between">
                <span className="display text-8xl text-bone/10 transition-colors duration-300 group-hover:text-bone/15">0{i + 1}</span>
                <StationPill status={s.status} />
              </div>
              <div className="mt-6 flex items-center gap-2 text-mute">
                <Gamepad2 className="size-4" aria-hidden /> PlayStation 5
              </div>
              <h3 className="display mt-1 text-4xl">Station 0{i + 1}</h3>
              <p className="mt-1 flex-1 text-sm text-mute" aria-live="polite">{detail}</p>
              <a
                href="#book"
                onClick={() => prefillBooking({ stationId: s.id })}
                className="btn btn-soft mt-6 w-full transition-colors hover:border-ember/30"
                aria-label={`Reserve PS5 Station 0${i + 1}`}
              >
                Reserve a station
              </a>
            </li>
          ))}
        </ul>

        {/* Live status table */}
        <div className="reveal mt-14 overflow-hidden rounded-3xl border border-line bg-ink">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
            <Radio className="size-4 text-ember" aria-hidden />
            <h3 className="display text-2xl">Live station status</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <caption className="sr-only">Live availability for each station</caption>
              <thead className="border-b border-line">
                <tr className="text-xs uppercase tracking-wider text-mute">
                  <th className="px-5 py-3 font-medium sm:px-6">Station</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="hidden px-3 py-3 font-medium sm:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {live.map(({ s, detail }) => (
                  <tr key={s.id} className="transition-colors hover:bg-white/[0.02]">
                    <th scope="row" className="px-5 py-4 font-semibold sm:px-6">
                      {s.name.replace(" · ", " ")}
                      <span className="mt-0.5 block text-xs font-normal text-mute sm:hidden">{detail}</span>
                    </th>
                    <td className="px-3 py-4"><StationPill status={s.status} /></td>
                    <td className="hidden px-3 py-4 text-mute sm:table-cell">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export { fmtClock };
