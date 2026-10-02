import { Link } from "react-router-dom";
import { BRAND } from "../../config/brand";
import { Logo } from "./Navbar";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="display text-6xl sm:text-8xl">See you<br />on the couch.</p>
            <a href="#book" className="btn btn-primary btn-lg mt-8">Book Your Session</a>
          </div>
          <address className="space-y-1 text-sm not-italic text-mute">
            <Logo className="mb-5" />
            <p>{BRAND.address}</p>
            <p>{BRAND.hours}</p>
            <p><a className="hover:text-bone" href={`tel:${BRAND.phone.replace(/\s/g, "")}`}>{BRAND.phone}</a></p>
            <p><a className="hover:text-bone" href={`mailto:${BRAND.email}`}>{BRAND.email}</a></p>
          </address>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-2 border-t border-line pt-6 text-xs text-mute sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND.name} {BRAND.suffix}. All rights reserved.</p>
          <Link to="/admin" className="hover:text-bone transition-colors">Staff login</Link>
        </div>
      </div>
    </footer>
  );
}
