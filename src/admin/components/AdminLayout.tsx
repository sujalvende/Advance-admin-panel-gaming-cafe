import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { BarChart3, CalendarCheck, Database, Download, KeyRound, LogOut, MoreHorizontal, Trash2, Upload, X } from "lucide-react";
import { BRAND } from "../../config/brand";
import logoImg from "../../assets/logo.jpg";
import { signOut, useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { ConfirmModal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import CredentialsModal from "./CredentialsModal";
import NotificationBell from "./NotificationBell";

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
  const [showMore, setShowMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  if (!authed) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${isActive ? "bg-bone text-ink" : "text-mute hover:text-bone"}`;

  async function handleExport() {
    try {
      const dataStr = await api.exportBackup();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gaming-cafe-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("success", "Backup downloaded");
    } catch (e) {
      fromError(e, "Backup failed");
    }
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        await api.importBackup(text);
        toast("success", "Backup restored successfully");
      } catch (err) {
        fromError(err, "Failed to restore backup");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">

          {/* Brand */}
          <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-3" title="Go to main website">
            <img
              src={logoImg}
              alt="PS PRO Gaming"
              className="size-8 shrink-0 rounded-lg object-contain shadow-[0_0_10px_rgba(0,200,255,0.3)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(0,200,255,0.65)] sm:size-9"
            />
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <span className="display truncate text-base tracking-tight transition-colors group-hover:text-ember sm:text-xl">
                {BRAND.name}
              </span>
              <span className="shrink-0 rounded-md bg-ember/15 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-ember sm:px-2 sm:text-[0.65rem]">
                Admin
              </span>
            </div>
          </Link>

          {/* Desktop centre nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Admin">
            {tabs.map((t) => <NavLink key={t.to} to={t.to} end={t.end} className={link}><t.icon className="size-4" />{t.label}</NavLink>)}
          </nav>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />

            {/* "View site" — desktop only */}
            <Link to="/" className="btn btn-ghost btn-sm hidden sm:inline-flex">View site</Link>

            {/* Notification bell — always visible */}
            <NotificationBell />

            {/* ── Desktop utility buttons (hidden on mobile & tablet) ── */}
            <button type="button" className="btn btn-ghost btn-icon hidden lg:inline-flex" aria-label="Export backup" title="Download full JSON database backup" onClick={handleExport}>
              <Download className="size-4" />
            </button>
            <button type="button" className="btn btn-ghost btn-icon hidden lg:inline-flex" aria-label="Import backup" title="Restore database from JSON backup" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
            </button>
            <button type="button" className="btn btn-ghost btn-icon hidden lg:inline-flex" aria-label="Clear data" title="Reset to fresh empty café" onClick={() => setReset("empty")}>
              <Trash2 className="size-4 text-warn" />
            </button>
            <button type="button" className="btn btn-ghost btn-icon hidden lg:inline-flex" aria-label="Manage credentials" title="Manage login credentials" onClick={() => setShowCreds(true)}>
              <KeyRound className="size-4" />
            </button>
            <button type="button" className="btn btn-ghost btn-icon hidden lg:inline-flex" aria-label="Load demo data" title="Load demo data" onClick={() => setReset("demo")}>
              <Database className="size-4" />
            </button>

            {/* ── "⋯ More" dropdown (visible on mobile & tablet, hidden on desktop lg+) ── */}
            <div className="relative lg:hidden" ref={moreRef}>
              <button
                ref={moreBtnRef}
                type="button"
                className="btn btn-ghost btn-icon"
                aria-label="More options"
                aria-expanded={showMore}
                onClick={() => setShowMore((o) => !o)}
              >
                {showMore ? <X className="size-4" /> : <MoreHorizontal className="size-4" />}
              </button>

              {showMore && (
                <MobileMoreDropdown
                  onExport={() => { handleExport(); setShowMore(false); }}
                  onImport={() => { fileInputRef.current?.click(); setShowMore(false); }}
                  onClear={() => { setReset("empty"); setShowMore(false); }}
                  onCreds={() => { setShowCreds(true); setShowMore(false); }}
                  onDemo={() => { setReset("demo"); setShowMore(false); }}
                  onClose={() => setShowMore(false)}
                  anchorRef={moreBtnRef}
                />
              )}
            </div>

            {/* Logout — always visible */}
            <button type="button" className="btn btn-ghost btn-icon" aria-label="Log out" title="Log out" onClick={signOut}>
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6"><Outlet /></main>

      {/* Mobile bottom tab bar */}
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

// ─── Mobile More Dropdown ─────────────────────────────────────────────────────

function MobileMoreDropdown({
  onExport, onImport, onClear, onCreds, onDemo, onClose, anchorRef,
}: {
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
  onCreds: () => void;
  onDemo: () => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const items = [
    { icon: Download, label: "Export backup", action: onExport },
    { icon: Upload,   label: "Import backup", action: onImport },
    { icon: Database, label: "Load demo data", action: onDemo },
    { icon: KeyRound, label: "Credentials",    action: onCreds },
    { icon: Trash2,   label: "Clear all data", action: onClear, danger: true },
  ];

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-ink shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-top-2 duration-150"
      role="menu"
      aria-label="More options"
    >
      {items.map(({ icon: Icon, label, action, danger }) => (
        <button
          key={label}
          type="button"
          role="menuitem"
          className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-panel2/60 ${danger ? "text-warn" : "text-bone"}`}
          onClick={action}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
