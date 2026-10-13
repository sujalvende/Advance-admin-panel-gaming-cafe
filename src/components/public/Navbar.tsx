import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BRAND } from "../../config/brand";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#home" className={`group flex items-center gap-3 ${className}`} aria-label={`${BRAND.name} ${BRAND.suffix} home`}>
      <img
        src="/logo.jpg"
        alt={`${BRAND.name} ${BRAND.suffix}`}
        className="size-11 rounded-xl object-contain shadow-[0_0_15px_rgba(0,200,255,0.25)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_22px_rgba(0,200,255,0.65)]"
      />
      <span className="leading-none">
        <span className="display block text-[1.65rem] tracking-tight">{BRAND.name}</span>
        <span className="block font-mono text-[0.58rem] uppercase tracking-[0.25em] text-cyan-400/90">{BRAND.suffix}</span>
      </span>
    </a>
  );
}


const LINKS = [
  ["Home", "#home"],
  ["Games", "#games"],
  ["Stations", "#stations"],
  ["Experience", "#experience"],
  ["Pricing", "#pricing"],
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || open ? "border-b border-line bg-ink/90 shadow-lg shadow-black/20 backdrop-blur-xl" : "border-b border-transparent"}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Main">
        <Logo />
        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map(([l, h]) => (
            <li key={h}>
              <a href={h} className="relative text-sm font-medium text-mute transition-colors hover:text-bone after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-ember after:transition-all hover:after:w-full">{l}</a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a href="#book" className="btn btn-primary btn-sm sm:px-5">Book Now</a>
          <button
            type="button"
            className="btn btn-ghost btn-icon md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-line bg-ink px-5 pb-6 pt-2 md:hidden">
          <ul className="mb-5">
            {LINKS.map(([l, h]) => (
              <li key={h} className="border-b border-line">
                <a
                  href={h}
                  onClick={() => setOpen(false)}
                  className="display flex min-h-14 items-center text-3xl transition-colors hover:text-ember"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <a href="#book" onClick={() => setOpen(false)} className="btn btn-primary btn-lg w-full">
            Book Your Session
          </a>
        </div>
      )}
    </header>
  );
}
