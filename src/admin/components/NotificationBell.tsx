import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Check, CheckCheck, Settings, Trash2, X, AlertTriangle, Info, AlertCircle } from "lucide-react";
import {
  useNotifications,
  useUnreadCount,
  markAllRead,
  markRead,
  clearAll,
  type Notification,
  type NotifLevel,
} from "../../lib/notifications";
import NotificationSettings from "./NotificationSettings";

function levelIcon(level: NotifLevel) {
  switch (level) {
    case "critical": return <AlertCircle className="size-4 shrink-0 text-bad" aria-hidden />;
    case "warning":  return <AlertTriangle className="size-4 shrink-0 text-warn" aria-hidden />;
    default:         return <Info className="size-4 shrink-0 text-sky-400" aria-hidden />;
  }
}

function levelBg(level: NotifLevel) {
  switch (level) {
    case "critical": return "border-l-bad/60";
    case "warning":  return "border-l-warn/60";
    default:         return "border-l-sky-400/60";
  }
}

function relTime(iso: string) {
  const diff = Date.now() - Date.parse(iso);
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function NotifItem({ n }: { n: Notification }) {
  return (
    <li
      className={`flex gap-3 border-b border-line border-l-2 px-4 py-3 transition-colors last:border-b-0 ${levelBg(n.level)} ${n.read ? "opacity-60" : "bg-panel2/30"}`}
    >
      <span className="mt-0.5">{levelIcon(n.level)}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold leading-snug ${n.read ? "text-mute" : "text-bone"}`}>{n.title}</p>
        <p className="mt-0.5 text-xs text-mute leading-snug">{n.body}</p>
        <p className="mt-1 text-[0.65rem] text-mute/60">{relTime(n.createdAt)}</p>
      </div>
      {!n.read && (
        <button
          type="button"
          aria-label="Mark as read"
          className="mt-0.5 shrink-0 rounded p-0.5 text-mute hover:text-bone transition-colors"
          onClick={() => markRead(n.id)}
        >
          <Check className="size-3.5" />
        </button>
      )}
    </li>
  );
}

export default function NotificationBell() {
  const notifs = useNotifications();
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Mark all read when panel opens
  useEffect(() => {
    if (open && unread > 0) {
      // Slight delay so badge updates feel responsive
      const t = setTimeout(markAllRead, 800);
      return () => clearTimeout(t);
    }
  }, [open, unread]);

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        ref={btnRef}
        type="button"
        id="notif-bell-btn"
        className="btn btn-ghost btn-icon relative"
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        {unread > 0 ? (
          <Bell className="size-4 text-ember" />
        ) : (
          <BellOff className="size-4" />
        )}
        {unread > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-bad text-[0.6rem] font-bold tabular-nums text-white shadow-md"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          id="notif-panel"
          className="absolute right-0 top-full z-50 mt-2 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-ink shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-semibold text-sm">Notifications</span>
            <div className="flex items-center gap-1">
              {notifs.length > 0 && (
                <>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon h-7 w-7"
                    aria-label="Mark all read"
                    title="Mark all as read"
                    onClick={markAllRead}
                  >
                    <CheckCheck className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon h-7 w-7"
                    aria-label="Clear all notifications"
                    title="Clear all"
                    onClick={clearAll}
                  >
                    <Trash2 className="size-3.5 text-warn" />
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-icon h-7 w-7"
                aria-label="Notification settings"
                title="Notification settings"
                onClick={() => { setShowSettings(true); setOpen(false); }}
              >
                <Settings className="size-3.5" />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon h-7 w-7"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <ul
            className="max-h-[26rem] overflow-y-auto"
            aria-live="polite"
            aria-label="Notification list"
          >
            {notifs.length === 0 ? (
              <li className="flex flex-col items-center gap-3 py-10 text-center text-mute">
                <BellOff className="size-8 opacity-30" aria-hidden />
                <span className="text-sm">No notifications yet</span>
                <span className="text-xs opacity-60">Session time alerts will appear here</span>
              </li>
            ) : (
              notifs.map((n) => <NotifItem key={n.id} n={n} />)
            )}
          </ul>

          {/* Footer hint */}
          {notifs.length > 0 && (
            <div className="border-t border-line px-4 py-2">
              <p className="text-[0.65rem] text-mute/60">
                Showing last {notifs.length} alert{notifs.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {showSettings && <NotificationSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
