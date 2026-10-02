import { ArrowUpRight } from "lucide-react";
import { BRAND } from "../../config/brand";

export default function BookingCTA() {
  return (
    <section aria-labelledby="ready" className="border-y border-line bg-ember text-ink">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center">
        <div>
          <h2 id="ready" className="display text-5xl sm:text-7xl">Ready to play?</h2>
          <p className="mt-2 max-w-md font-medium text-ink/75">Takes under a minute. We confirm on WhatsApp or call {BRAND.phone}.</p>
        </div>
        <a href="#book" className="btn btn-lg group bg-ink text-bone hover:bg-panel2">
          Book Your Session
          <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </div>
    </section>
  );
}
