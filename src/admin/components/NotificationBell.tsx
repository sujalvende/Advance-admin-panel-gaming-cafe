import { useEffect, useRef, useState } from "react"
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Settings,
  Trash2,
  X,
  AlertTriangle,
  Info,
  AlertCircle,
} from "lucide-react"
import {
  useNotifications,
  useUnreadCount,
  markAllRead,
  markRead,
  clearAll,
  type Notification,
  type NotifLevel,
} from "../../lib/notifications"
import NotificationSettings from "./NotificationSettings"

function levelIcon(level: NotifLevel) {
  switch (level) {
    case "critical":
      return <AlertCircle className="size-4 shrink-0 text-bad" aria-hidden />
    case "warning":
      return <AlertTriangle className="size-4 shrink-0 text-warn" aria-hidden />
    default:
      return <Info className="size-4 shrink-0 text-sky-400" aria-hidden />
  }
}

function levelBg(level: NotifLevel) {
  switch (level) {
    case "critical":
      return "border-l-bad/60"
    case "warning":
      return "border-l-warn/60"
    default:
      return "border-l-sky-400/60"
  }
}

function relTime(iso: string) {
  const ts = Date.parse(iso)
  if (!iso || Number.isNaN(ts)) return "just now"
  const diff = Date.now() - ts
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })
}

function NotifItem({ n }: { n: Notification }) {
  return (
    <li
      className={`flex gap-3 border-b border-line border-l-2 px-4 py-3 transition-colors last:border-b-0 ${levelBg(n.level)} ${
        n.read ? "opacity-60" : "bg-panel2/30"
      }`}
    >
      <span className="mt-0.5">{levelIcon(n.level)}</span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold leading-snug ${
            n.read ? "text-mute" : "text-bone"
          }`}
        >
          {n.title}
        </p>
        <p className="mt-0.5 text-xs text-mute leading-snug">{n.body}</p>
        <p className="mt-1 text-[0.65rem] text-mute/60">
          {relTime(n.createdAt)}
        </p>
      </div>
      {!n.read && (
        <button
          type="button"
          aria-label="Mark as read"
          title="Mark as read"
          className="mt-0.5 shrink-0 rounded p-0.5 text-mute hover:text-bone transition-colors"
          onClick={() => markRead(n.id)}
        >
          <Check className="size-3.5" />
        </button>
      )}
    </li>
  )
}

export default function NotificationBell() {
  const notifs = useNotifications()
  const unread = useUnreadCount()
  const [open, setOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        ref={btnRef}
        type="button"
        id="notif-bell-btn"
        className="btn btn-ghost btn-icon relative"
        aria-label={
          unread > 0 ? `${unread} unread notifications` : "Notifications"
        }
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

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby="notif-heading"
          id="notif-panel"
          className="fixed inset-x-3 top-16 z-50 flex max-h-[80vh] max-w-md mx-auto flex-col overflow-hidden rounded-2xl border border-line bg-ink shadow-2xl shadow-black/80 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[22rem] sm:max-h-none sm:max-w-[calc(100vw-2rem)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 id="notif-heading" className="font-semibold text-sm">
                Notifications
              </h2>
              {unread > 0 && (
                <span className="rounded-full bg-bad/20 px-1.5 py-0.5 text-[0.65rem] font-bold text-bad tabular-nums">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifs.length > 0 && (
                <>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-mute hover:border-line hover:bg-panel2 hover:text-bone transition-colors"
                    aria-label="Mark all read"
                    title="Mark all as read"
                    onClick={markAllRead}
                  >
                    <CheckCheck className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-mute hover:border-line hover:bg-panel2 hover:text-warn transition-colors"
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
                className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-mute hover:border-line hover:bg-panel2 hover:text-bone transition-colors"
                aria-label="Notification settings"
                title="Notification settings"
                onClick={() => {
                  setShowSettings(true)
                  setOpen(false)
                }}
              >
                <Settings className="size-3.5" />
              </button>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-mute hover:border-line hover:bg-panel2 hover:text-bone transition-colors"
                aria-label="Close notifications"
                title="Close"
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
                <span className="text-xs opacity-60">
                  Session time alerts will appear here
                </span>
              </li>
            ) : (
              notifs.map((n) => <NotifItem key={n.id} n={n} />)
            )}
          </ul>

          {/* Footer hint */}
          {notifs.length > 0 && (
            <div className="border-t border-line px-4 py-2">
              <p className="text-[0.65rem] text-mute/60">
                Showing last {notifs.length} alert
                {notifs.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {showSettings && (
        <NotificationSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
