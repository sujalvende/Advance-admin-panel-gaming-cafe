import { Armchair, Flag, Gamepad2, Glasses, Swords, Users } from "lucide-react";
import { BRAND } from "../../config/brand";

const CARDS = [
  { icon: Gamepad2, title: "PS5, properly set up", text: "Big screens, low-latency displays, DualSense pads charged and ready." },
  { icon: Users, title: "Built for groups", text: "Bring four, six or ten. Players join and leave freely, you only pay for the time you play." },
  { icon: Swords, title: "Multiplayer nights", text: "Split-screen derbies, co-op campaigns and tournaments on request." },
  { icon: Flag, title: "Pro sim racing", text: "Force-feedback wheel, load-cell pedals and a bucket seat." },
  { icon: Glasses, title: "VR, soon", text: "A dedicated VR zone is on the way. Follow along for the opening date." },
  { icon: Armchair, title: "Comfort first", text: "Cool, quiet, well-lit seating with snacks and water close at hand." },
];

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-32" aria-labelledby="exp-h">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="reveal lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">The experience</p>
          <h2 id="exp-h" className="display mt-4 text-[clamp(3rem,10vw,7rem)]">
            A lounge,<br />not a<br /><span className="text-ember">arcade.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-mute">
            {BRAND.name} is where console gaming gets the treatment it deserves: calm lighting, serious hardware and enough room for everyone to play together.
          </p>
          <div className="mt-8 overflow-hidden rounded-3xl border border-line">
            <img
              src={BRAND.experienceImage}
              alt="Player holding a controller during a session at the lounge"
              loading="lazy"
              className="aspect-[4/3] w-full bg-panel object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

        {/* Feature cards — no translate on mobile to avoid overflow */}
        <ul className="grid gap-4 sm:grid-cols-2">
          {CARDS.map(({ icon: I, title, text }, i) => (
            <li
              key={title}
              className={`reveal card group p-6 transition-all duration-300 hover:border-ember/40 hover:bg-panel2 hover:shadow-lg hover:shadow-black/30 ${
                i % 2 ? "sm:translate-y-8" : ""
              }`}
            >
              <I className="size-7 text-ember transition-transform duration-300 group-hover:scale-110" strokeWidth={1.6} aria-hidden />
              <h3 className="display mt-8 text-3xl">{title}</h3>
              <p className="mt-2 leading-relaxed text-mute">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
