import { useState, useEffect, useId, useRef, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";

export function Modal({
  open, onClose, title, subtitle, children, footer, wide,
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const node = ref.current;
    const focusable = () =>
      Array.from(node?.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])') ?? []).filter((e) => !e.hasAttribute("disabled"));
    (node?.querySelector<HTMLElement>("[data-autofocus]") ?? focusable()[1] ?? focusable()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = focusable();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={`modal-in relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-panel shadow-2xl shadow-black/60 sm:rounded-3xl ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="display text-2xl">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-mute">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon -mr-2 shrink-0" aria-label="Close dialog">
            <X className="size-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</footer>}
      </div>
    </div>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} aria-hidden />;
}

export function BusyButton({
  busy, children, className = "btn btn-primary", ...rest
}: { busy?: boolean; children: ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} disabled={busy || rest.disabled} className={className}>
      {busy && <Spinner />}
      {children}
    </button>
  );
}

export function useBusy(): [boolean, (fn: () => Promise<void>) => Promise<void>] {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };
  return [busy, run];
}

export function ConfirmModal({
  open, onClose, title, body, confirmLabel, danger, onConfirm,
}: {
  open: boolean; onClose: () => void; title: string; body: ReactNode;
  confirmLabel: string; danger?: boolean; onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useBusy();
  return (
    <Modal
      open={open} onClose={onClose} title={title}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <BusyButton busy={busy} className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={() => setBusy(onConfirm)}>
            {confirmLabel}
          </BusyButton>
        </>
      }
    >
      <div className="text-mute">{body}</div>
    </Modal>
  );
}
