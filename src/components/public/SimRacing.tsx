import { Gauge, Move3d, Trophy } from "lucide-react";
import { BRAND } from "../../config/brand";
import { useDb } from "../../lib/store";
import StationPill from "../ui/StationPill";
import { prefillBooking } from "./Stations";

export default function SimRacing() {
  const sim = useDb().stations.find((s) => s.type === "sim");
  return (
    <section id="sim" className="relative overflow-hidden border-y border-line bg-panel" aria-labelledby="sim-h">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:gap-20">
        <div className="reveal order-2 lg:order-1">
          <p className="eyebrow">Sim racing</p>
          <h2 id="sim-h" className="display mt-4 text-6xl sm:text-8xl">Pro sim<br />racing<br /><span className="text-ember">experience.</span></h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-mute">
            A real bucket seat, a force-feedback wheel and pedals that punish a late brake. Gran Turismo 7 as it was meant to be driven.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {[[Gauge, "Force feedback", "Feel every kerb"], [Move3d, "Immersive rig", "Seat, wheel, pedals"], [Trophy, "Race titles", "GT7 and more"]].map(([I, t, d]) => {
              const Icon = I as typeof Gauge;
              return (
                <li key={t as string} className="border-t border-line pt-4">
                  <Icon className="size-5 text-ember" aria-hidden />
                  <p className="mt-3 font-semibold">{t as string}</p>
                  <p className="text-sm text-mute">{d as string}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#book" onClick={() => prefillBooking({ stationId: sim?.id })} className="btn btn-primary btn-lg">Book Sim Racing</a>
            {sim && <StationPill status={sim.status} />}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-[2rem] border border-line lg:max-w-none">
            <img src={BRAND.simImage} alt="Driver in a professional racing simulator with multiple screens" loading="lazy" className="size-full bg-panel2 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <p className="display absolute bottom-5 left-6 text-5xl text-bone/90">P1</p>
          </div>
        </div>
      </div>
    </section>
  );
}
