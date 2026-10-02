import { BRAND } from "../../config/brand";

export default function VRComingSoon() {
  return (
    <section id="vr" className="relative isolate overflow-hidden" aria-labelledby="vr-h">
      <img src={BRAND.vrImage} alt="" loading="lazy" className="absolute inset-0 -z-20 size-full bg-panel object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_50%_50%,transparent,#0c0b0a_95%)]" />
      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 py-28 text-center sm:px-8 sm:py-40">
        <span className="inline-flex items-center gap-2 rounded-full border border-warn/40 bg-warn/10 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-warn">
          <span className="pulse-dot size-1.5 rounded-full bg-current" aria-hidden /> Not bookable yet
        </span>
        <h2 id="vr-h" className="display mt-8 text-[clamp(3.5rem,13vw,10rem)]">
          VR experience<br /><span className="text-transparent [-webkit-text-stroke:2px_var(--color-bone)]">coming soon</span>
        </h2>
        <p className="mt-6 max-w-lg text-lg text-bone/75">
          Step inside the game. A dedicated VR zone is being built right now. Bookings open when the doors do.
        </p>
        <a href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent("Hi! Please let me know when VR opens.")}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-lg mt-10 backdrop-blur">
          Notify me on WhatsApp
        </a>
      </div>
    </section>
  );
}
