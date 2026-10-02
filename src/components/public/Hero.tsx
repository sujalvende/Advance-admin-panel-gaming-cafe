import { ArrowDown, ArrowRight } from "lucide-react";
import { BRAND } from "../../config/brand";
import { useDb } from "../../lib/store";

export default function Hero() {
  const { stations } = useDb();
  const ps5 = stations.filter((s) => s.type === "ps5");
  const free = ps5.filter((s) => s.status === "available").length;

  return (
    <section id="home" className="relative isolate overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0 -z-20 bg-panel">
        <img
          src={BRAND.heroImage}
          alt=""
          fetchPriority="high"
          className="size-full object-cover object-[70%_50%] opacity-55 sm:object-center"
        />
      </div>
      {/* Gradient overlays */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(12_11_10/.6)_0%,rgb(12_11_10/.15)_40%,#0c0b0a_100%),linear-gradient(90deg,#0c0b0a_0%,rgb(12_11_10/.65)_45%,transparent_100%)]" />
      <div className="grid-drift absolute inset-0 -z-10 opacity-50 [mask-image:linear-gradient(180deg,transparent,black_40%,transparent)]" aria-hidden />

      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col justify-end px-5 pb-12 pt-16 sm:px-8 sm:pb-20 lg:justify-center">
        <p className="eyebrow hero-rise [animation-delay:.05s]">
          {BRAND.name} {BRAND.suffix} · {BRAND.city}
        </p>
        <h1 className="display hero-rise mt-4 text-[clamp(3.8rem,16vw,12rem)] [animation-delay:.12s] sm:mt-5">
          Press start.
          <span className="block text-ember">Stay a while.</span>
        </h1>
        <p className="hero-rise mt-5 max-w-xl text-base leading-relaxed text-bone/80 [animation-delay:.25s] sm:mt-6 sm:text-xl">
          Three PS5 stations, a pro sim-racing rig and a lounge built for long sessions with friends. Pick a slot, bring your crew, we handle the rest.
        </p>
        <div className="hero-rise mt-7 flex flex-wrap gap-3 [animation-delay:.35s] sm:mt-8">
          <a href="#book" className="btn btn-primary btn-lg group">
            Book Now
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </a>
          <a href="#games" className="btn btn-ghost btn-lg backdrop-blur">
            Explore Games
            <ArrowDown className="size-5" />
          </a>
        </div>

        {/* Live stats */}
        <dl className="hero-rise mt-10 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line/60 backdrop-blur-md [animation-delay:.5s] sm:mt-12">
          {[
            ["3", "PS5 stations"],
            ["1", "Pro sim rig"],
            [`${free}/${ps5.length}`, "PS5 free now"],
          ].map(([v, l]) => (
            <div key={l} className="bg-ink/70 px-3 py-4 sm:px-6">
              <dd className="display text-3xl sm:text-5xl">{v}</dd>
              <dt className="mt-1 text-[0.65rem] text-mute sm:text-sm">{l}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
