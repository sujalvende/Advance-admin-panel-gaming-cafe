import { useState, type FormEvent } from "react";
import { Navigate, Link } from "react-router-dom";
import { KeyRound, Sparkles } from "lucide-react";
import { BRAND } from "../../config/brand";
import { getCredentials, signIn, useAuth } from "../../lib/auth";
import { BusyButton } from "../../components/ui/Modal";

export default function Login() {
  const authed = useAuth();
  const creds = getCredentials();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (authed) return <Navigate to="/admin" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  function autofill() {
    const current = getCredentials();
    setEmail(current.email);
    setPassword(current.password);
    setError("");
  }

  return (
    <div className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="group inline-flex flex-col">
          <span className="display text-4xl transition-colors group-hover:text-ember">{BRAND.name}</span>
          <span className="eyebrow mt-1">← Return to main website</span>
        </Link>

        <form onSubmit={submit} className="card mt-8 space-y-5 p-6">
          <div className="flex items-center justify-between">
            <h1 className="display text-2xl">Staff Sign In</h1>
            <button
              type="button"
              onClick={autofill}
              className="inline-flex items-center gap-1 rounded-full border border-ember/30 bg-ember/10 px-2.5 py-1 text-xs font-semibold text-ember hover:bg-ember/20"
              title="Fill saved credentials"
            >
              <Sparkles className="size-3" /> Auto-fill
            </button>
          </div>

          <div>
            <label className="label" htmlFor="li-email">
              Email
            </label>
            <input
              id="li-email"
              type="email"
              autoComplete="username"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin email"
            />
          </div>

          <div>
            <label className="label" htmlFor="li-pass">
              Password
            </label>
            <input
              id="li-pass"
              type="password"
              autoComplete="current-password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p role="alert" className="text-sm text-bad">{error}</p>}

          <BusyButton busy={busy} type="submit" className="btn btn-primary btn-lg w-full">
            Sign in
          </BusyButton>
        </form>

        <div className="mt-5 rounded-2xl border border-dashed border-line p-4 text-xs leading-relaxed text-mute">
          <div className="flex items-center gap-1.5 font-semibold text-bone">
            <KeyRound className="size-3.5 text-ember" /> Saved in localStorage:
          </div>
          <p className="mt-1">
            Email: <span className="font-mono text-bone">{creds.email}</span>
            <br />
            Password: <span className="font-mono text-bone">{creds.password}</span>
          </p>
          <p className="mt-2 text-[0.7rem] text-mute/80">
            Sessions and credentials persist in your browser's <span className="font-mono">localStorage</span>. You can change them anytime from the admin toolbar.
          </p>
        </div>
      </div>
    </div>
  );
}
