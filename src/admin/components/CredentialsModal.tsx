import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getCredentials, saveCredentials } from "../../lib/auth";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";

export default function CredentialsModal({ onClose }: { onClose: () => void }) {
  const current = getCredentials();
  const [email, setEmail] = useState(current.email);
  const [password, setPassword] = useState(current.password);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast("warn", "Email and password cannot be empty.");
      return;
    }
    saveCredentials(email, password);
    toast("success", "Login credentials updated in localStorage");
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Admin Credentials"
      subtitle="Saved in browser localStorage for offline & persistent access."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            Save Changes
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="cm-email">
            Login ID / Username
          </label>
          <input
            id="cm-email"
            type="text"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="cm-password">
            Admin Password
          </label>
          <div className="relative">
            <input
              id="cm-password"
              type={showPassword ? "text" : "password"}
              required
              className="input pr-10 font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <div className="rounded-2xl border border-line bg-panel2 p-3.5 text-xs text-mute">
          <p className="font-semibold text-bone">Stored locally:</p>
          <p className="mt-1">
            These credentials are saved under the key{" "}
            <span className="font-mono text-ember">respawn.admin.credentials</span> in your browser's localStorage.
          </p>
        </div>
      </form>
    </Modal>
  );
}
