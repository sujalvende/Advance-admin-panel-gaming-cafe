import { useState, type FormEvent } from "react";
import { getCredentials, saveCredentials } from "../../lib/auth";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";

export default function CredentialsModal({ onClose }: { onClose: () => void }) {
  const current = getCredentials();
  const [email, setEmail] = useState(current.email);
  const [password, setPassword] = useState(current.password);
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
            Admin Email
          </label>
          <input
            id="cm-email"
            type="email"
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
          <input
            id="cm-password"
            type="text"
            required
            className="input font-mono"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-mute">
            Shown in plain text here so you can easily verify what you saved.
          </p>
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
