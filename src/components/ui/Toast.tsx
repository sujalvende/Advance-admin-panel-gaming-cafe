import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { ApiError } from "../../lib/api";

type Kind = "success" | "warn" | "error";
interface T { id: number; kind: Kind; text: string }
interface Ctx { toast: (kind: Kind, text: string) => void; fromError: (e: unknown, fallback?: string) => void }

const ToastCtx = createContext<Ctx>({ toast: () => {}, fromError: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const toast = useCallback((kind: Kind, text: string) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-3), { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4200);
  }, []);
  const fromError = useCallback(
    (e: unknown, fallback = "Something went wrong. Please try again.") =>
      toast(e instanceof ApiError ? "warn" : "error", e instanceof ApiError ? e.message : fallback),
    [toast],
  );
  const Icon = { success: CheckCircle2, warn: AlertTriangle, error: XCircle };
  const tone = { success: "text-ok", warn: "text-warn", error: "text-bad" };
  return (
    <ToastCtx.Provider value={{ toast, fromError }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6" role="status" aria-live="polite">
        {items.map((t) => {
          const I = Icon[t.kind];
          return (
            <div key={t.id} className="toast pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-panel2 px-4 py-3 text-sm shadow-2xl shadow-black/50">
              <I className={`size-5 shrink-0 ${tone[t.kind]}`} aria-hidden />
              <span>{t.text}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
