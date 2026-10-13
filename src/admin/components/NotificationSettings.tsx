import { useState } from "react";
import { Bell, Monitor, Play, Volume2, X } from "lucide-react";
import { useNotifSettings, playAlertSound } from "../../lib/notifications";

interface Props {
  onClose: () => void;
}

export default function NotificationSettings({ onClose }: Props) {
  const [settings, setSettings] = useNotifSettings();
  const [desktopStatus, setDesktopStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  function update(patch: Partial<typeof settings>) {
    setSettings({ ...settings, ...patch });
  }

  async function requestDesktop() {
    if (!("Notification" in window)) {
      setDesktopStatus("denied");
      return;
    }
    if (Notification.permission === "granted") {
      update({ desktop: true });
      setDesktopStatus("granted");
      return;
    }
    setDesktopStatus("requesting");
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      update({ desktop: true });
      setDesktopStatus("granted");
    } else {
      update({ desktop: false });
      setDesktopStatus("denied");
    }
  }

  const desktopGranted = typeof window !== "undefined" && Notification.permission === "granted";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-settings-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-ink shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-ember" aria-hidden />
            <h2 id="notif-settings-title" className="font-semibold">Notification Settings</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-1 p-5">
          {/* In-app notifications */}
          <Row
            icon={<Bell className="size-4 text-ember" />}
            label="In-app notifications"
            description="Show alerts inside the admin panel"
            checked={settings.inApp}
            onChange={(v) => update({ inApp: v })}
            id="notif-inapp"
          />

          {/* 1-minute warning */}
          <Row
            icon={<Bell className="size-4 text-warn" />}
            label="1-minute advance warning"
            description="Alert when a session has 1 minute left"
            checked={settings.warnOneMin}
            onChange={(v) => update({ warnOneMin: v })}
            id="notif-warn1"
          />

          {/* Desktop notifications */}
          <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-panel2/30">
            <div className="flex items-start gap-3">
              <Monitor className="mt-0.5 size-4 shrink-0 text-sky-400" aria-hidden />
              <div>
                <p className="text-sm font-medium">Browser desktop notifications</p>
                <p className="text-xs text-mute">Show system notifications even when tab is in background</p>
                {desktopStatus === "denied" && (
                  <p className="mt-1 text-xs text-bad">Permission denied — enable in browser settings</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!desktopGranted && settings.desktop === false && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-xs px-2 py-1 h-auto"
                  onClick={requestDesktop}
                  disabled={desktopStatus === "requesting"}
                  aria-label="Request desktop notification permission"
                >
                  {desktopStatus === "requesting" ? "Asking…" : "Allow"}
                </button>
              )}
              <Toggle
                id="notif-desktop"
                checked={settings.desktop}
                onChange={(v) => {
                  if (v && !desktopGranted) { requestDesktop(); return; }
                  update({ desktop: v });
                }}
              />
            </div>
          </div>

          {/* Sound */}
          <Row
            icon={<Volume2 className="size-4 text-ok" />}
            label="Sound alerts"
            description="Play a chime when a session expires"
            checked={settings.sound}
            onChange={(v) => update({ sound: v })}
            id="notif-sound"
          />

          {/* Volume slider */}
          {settings.sound && (
            <div className="ml-7 mt-1 flex items-center gap-3 px-3 pb-2">
              <Volume2 className="size-3.5 shrink-0 text-mute" aria-hidden />
              <input
                id="notif-volume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                onChange={(e) => update({ volume: parseFloat(e.target.value) })}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-ember"
                aria-label="Alert volume"
              />
              <span className="w-8 text-right font-mono text-xs text-mute">
                {Math.round(settings.volume * 100)}%
              </span>
              <button
                type="button"
                id="notif-test-sound"
                className="btn btn-ghost btn-sm flex-shrink-0 text-xs px-2 py-1 h-auto"
                title="Test alert sound"
                onClick={() => playAlertSound(settings.volume)}
                aria-label="Test notification sound"
              >
                <Play className="size-3 mr-1" />
                Test
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-line px-5 py-4">
          <p className="text-xs text-mute">
            Settings are saved automatically to this browser and persist across page refreshes.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Row({
  icon,
  label,
  description,
  checked,
  onChange,
  id,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-panel2/30">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0" aria-hidden>{icon}</span>
        <div>
          <label htmlFor={id} className="cursor-pointer text-sm font-medium">{label}</label>
          <p className="text-xs text-mute">{description}</p>
        </div>
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  );
}

function Toggle({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${checked ? "bg-ember" : "bg-line"}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-md ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
