import { useState, type FormEvent } from "react";
import { Navigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { BRAND } from "../../config/brand";
import logoImg from "../../assets/logo.jpg";
import { signIn, useAuth } from "../../lib/auth";
import { BusyButton } from "../../components/ui/Modal";

export default function Login() {
  const authed = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="group flex flex-col items-center text-center">
          <img
            src={logoImg}
            alt="PS PRO Gaming"
            className="size-20 rounded-2xl object-contain shadow-[0_0_25px_rgba(0,200,255,0.35)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(0,200,255,0.65)] mb-3"
          />
          <span className="display text-4xl transition-colors group-hover:text-ember">{BRAND.name}</span>
          <span className="eyebrow mt-1">← Return to main website</span>
        </Link>

        <form onSubmit={submit} className="card mt-8 space-y-5 p-6">
          <h1 className="display text-2xl">Staff Sign In</h1>

          <div>
            <label className="label" htmlFor="li-username">
              Login ID
            </label>
            <input
              id="li-username"
              type="text"
              autoComplete="username"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shubhampspro"
            />
          </div>

          <div>
            <label className="label" htmlFor="li-pass">
              Password
            </label>
            <div className="relative">
              <input
                id="li-pass"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-mute hover:text-bone focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-bad">{error}</p>}

          <BusyButton busy={busy} type="submit" className="btn btn-primary btn-lg w-full">
            Sign in
          </BusyButton>
        </form>
      </div>
    </div>
  );
}
