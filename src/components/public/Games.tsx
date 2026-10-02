import { useState } from "react";
import { ArrowUpRight, Users } from "lucide-react";
import { useDb } from "../../lib/store";
import { prefillBooking } from "./Stations";

export default function Games() {
  const { games } = useDb();
  const active = games.filter((g) => g.active);
  const genres = ["All", ...Array.from(new Set(active.map((g) => g.genre)))];
  const [genre, setGenre] = useState("All");
  const list = active.filter((g) => genre === "All" || g.genre === genre);

  return (
    <section id="games" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-32" aria-labelledby="games-h">
      <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">The library</p>
          <h2 id="games-h" className="display mt-4 text-[clamp(3rem,10vw,7rem)]">
            Pick a game.<br /><span className="text-ember">Pick a fight.</span>
          </h2>
        </div>
        {/* Genre filter — horizontal scroll on mobile, wrap on desktop */}
        <div
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          role="group"
          aria-label="Filter games by genre"
        >
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              aria-pressed={genre === g}
              className={`btn btn-sm shrink-0 border transition-all ${
                genre === g
                  ? "border-bone bg-bone text-ink shadow-md shadow-black/30"
                  : "border-line text-mute hover:border-bone/40 hover:text-bone"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mt-14 rounded-3xl border border-dashed border-line p-12 text-center text-mute">
          No games in this category yet.
        </p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((g) => (
            <li
              key={g.id}
              className="reveal group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-3xl border border-line p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/60 sm:p-6"
              style={{ background: `radial-gradient(120% 90% at 100% 0%, hsl(${g.hue} 55% 22% / .9), transparent 60%), #151311` }}
            >
              {g.image && (
                <img
                  src={g.image}
                  alt={`${g.title} artwork`}
                  loading="lazy"
                  className="absolute inset-0 -z-10 size-full object-cover opacity-40 transition-opacity duration-300 group-hover:opacity-55"
                />
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-bone/20 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-bone/80">
                  {g.genre}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-bone/70">
                  <Users className="size-3.5" aria-hidden />{g.multiplayer}
                </span>
              </div>
              <div>
                <h3 className="display text-4xl sm:text-5xl">{g.title}</h3>
                <p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-bone/70">{g.description}</p>
                <a
                  href="#book"
                  onClick={() => prefillBooking({ gameId: g.id })}
                  className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-ember transition-all hover:gap-2.5 group-hover:underline"
                >
                  Play now <ArrowUpRight className="size-4" aria-hidden />
                  <span className="sr-only">{g.title}</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
