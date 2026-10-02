import { useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { BarChart3, CalendarCheck, Database, KeyRound, LogOut } from "lucide-react";
import { BRAND } from "../../config/brand";
import { signOut, useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { ConfirmModal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import CredentialsModal from "./CredentialsModal";

const tabs = [
  { to: "/admin", label: "Bookings", icon: CalendarCheck, end: true },
  { to: "/admin/history", label: "Dashboard", icon: BarChart3, end: false },
];

export default function AdminLayout() {
  const authed = useAuth();
  const loc = useLocation();
  const { toast, fromError } = useToast();
  const [reset, setReset] = useState<null | "demo" | "empty">(null);
  const [showCreds, setShowCreds] = useState(false);

  if (!authed) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${isActive ? "bg-bone text-ink" : "text-mute hover:text-bone"}`;

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5" title="Go to main website">
            <span className="display text-2xl transition-colors group-hover:text-ember">{BRAND.name}</span>
            <span className="rounded-md bg-ember/15 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-ember">Admin</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Admin">
            {tabs.map((t) => <NavLink key={t.to} to={t.to} end={t.end} className={link}><t.icon className="size-4" />{t.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-1">
            <Link to="/" className="btn btn-ghost btn-sm hidden sm:inline-flex">View site</Link>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label="Manage login credentials"
              title="Manage login credentials (localStorage)"
              onClick={() => setShowCreds(true)}
            >
              <KeyRound className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label="Load demo data"
              title="Load demo data"
              onClick={() => setReset("demo")}
            >
              <Database className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label="Log out"
              title="Log out"
              onClick={signOut}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><Outlet /></main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Admin">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${isActive ? "text-ember" : "text-mute"}`}>
            <t.icon className="size-5" />{t.label}
          </NavLink>
        ))}
      </nav>

      {showCreds && <CredentialsModal onClose={() => setShowCreds(false)} />}

      <ConfirmModal open={reset !== null} onClose={() => setReset(null)} danger title="Replace all data?"
        confirmLabel={reset === "empty" ? "Clear everything" : "Load demo data"}
        body={<div className="space-y-3"><p>This replaces every booking in this browser with {reset === "empty" ? "an empty café" : "sample bookings so you can try the workflow"}.</p>
          <button type="button" className="underline hover:text-bone" onClick={() => setReset(reset === "empty" ? "demo" : "empty")}>Switch to {reset === "empty" ? "demo data" : "a clean start"} instead</button></div>}
        onConfirm={async () => { try { await api.resetData(reset!); toast("success", "Data replaced"); setReset(null); } catch (e) { fromError(e); } }} />
    </div>
  );
}
