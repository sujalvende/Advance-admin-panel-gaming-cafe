import { useDb } from "../../lib/store";
import { fmtINR } from "../../lib/time";
import { prefillBooking } from "./Stations";

export default function Pricing() {
  const { rules, stations } = useDb();
  const ps5 = rules.find((r) => r.stationType === "ps5");
  const sim = rules.find((r) => r.stationType === "sim");
  const simStation = stations.find((s) => s.type === "sim");
  const per = (u?: string) => (u === "half_hour" ? "per player · billed per 30 min" : "per player / hour");

  const tiers = [
    { name: "PS5", price: ps5 ? fmtINR(ps5.rate) : "—", note: per(ps5?.unit), body: `Any game in the library. Billed to the minute after the first ${ps5?.minMinutes ?? 10} minutes.`, cta: "Book PS5", prefill: {} },
    {
      name: "Group", price: ps5?.groupRate != null ? fmtINR(ps5.groupRate) : "Ask us",
      note: ps5?.groupRate != null ? `per player / hour · ${ps5.groupMinPlayers}+ players` : "group rates on request",
      body: "Bringing a squad? Everyone is timed separately, so people can join or leave without fuss.", cta: "Book a group", prefill: {}, featured: true,
    },
    { name: "Sim Racing", price: sim ? fmtINR(sim.rate) : "—", note: per(sim?.unit), body: "Force-feedback wheel, pedals and bucket seat.", cta: "Book Sim Racing", prefill: { stationId: simStation?.id } },
    { name: "VR", price: "Soon", note: "opening later", body: "Pricing will be announced with the launch.", cta: "", prefill: {} },
  ];

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="pr-h">
      <div className="reveal">
        <p className="eyebrow">Pricing</p>
        <h2 id="pr-h" className="display mt-4 text-6xl sm:text-8xl">Simple.<br />Pay for the<br /><span className="text-ember">time you play.</span></h2>
      </div>
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <li key={t.name} className={`reveal flex flex-col rounded-3xl border p-6 ${t.featured ? "border-ember bg-ember/10" : "card"} ${t.name === "VR" ? "opacity-70" : ""}`}>
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-mute">{t.name}</h3>
            <p className="display mt-6 text-7xl">{t.price}</p>
            <p className="mt-1 text-sm text-mute">{t.note}</p>
            <p className="mt-6 flex-1 text-sm leading-relaxed text-bone/80">{t.body}</p>
            {t.cta ? (
              <a href="#book" onClick={() => prefillBooking(t.prefill)} className={`btn mt-8 ${t.featured ? "btn-primary" : "btn-soft"}`}>{t.cta}</a>
            ) : (
              <span className="btn mt-8 border border-dashed border-line text-mute" aria-disabled>Coming soon</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
