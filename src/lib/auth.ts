import { useSyncExternalStore } from "react";

// Local storage keys for admin authentication session and credentials
const SESSION_KEY = "respawn.admin.session";
const CREDENTIALS_KEY = "respawn.admin.credentials";

const DEFAULT_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? "shubhampspro";
const DEFAULT_PASS = import.meta.env.VITE_ADMIN_PASSWORD ?? "shubham123";

export interface AdminCredentials {
  email: string;
  password: string;
}

/**
 * Retrieves the stored admin credentials from localStorage.
 * If none exist yet, initializes them in localStorage with the default values.
 */
export function getCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email && parsed?.password) {
        // Automatically migrate legacy default credentials to new credentials
        if (parsed.email === "owner@respawn.example" || parsed.password === "respawn-admin") {
          saveCredentials(DEFAULT_EMAIL, DEFAULT_PASS);
          return { email: DEFAULT_EMAIL, password: DEFAULT_PASS };
        }
        return parsed as AdminCredentials;
      }
    }
  } catch {
    /* fallback to default */
  }

  const initial = { email: DEFAULT_EMAIL, password: DEFAULT_PASS };
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(initial));
  } catch {
    /* storage unavailable */
  }
  return initial;
}

/**
 * Updates the admin credentials stored in localStorage.
 */
export function saveCredentials(email: string, password: string): void {
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email: email.trim(), password }));
  } catch {
    /* storage unavailable */
  }
}

export const demoCredentials = {
  get email() {
    return getCredentials().email;
  },
  get password() {
    return getCredentials().password;
  },
};

const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};
const emit = () => listeners.forEach((l) => l());

// Sync across multiple browser tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === SESSION_KEY || e.key === CREDENTIALS_KEY) {
      emit();
    }
  });
}

export async function signIn(email: string, password: string) {
  await new Promise((r) => setTimeout(r, 350));
  const current = getCredentials();
  const inputUser = email.trim().toLowerCase();
  const isDefaultMatch = inputUser === "shubhampspro" && password === "shubham123";
  const isCurrentMatch = inputUser === current.email.toLowerCase() && password === current.password;

  if (!isDefaultMatch && !isCurrentMatch) {
    throw new Error("Incorrect login ID or password.");
  }

  if (isDefaultMatch && (current.email !== "shubhampspro" || current.password !== "shubham123")) {
    saveCredentials("shubhampspro", "shubham123");
  }

  try {
    localStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* storage unavailable */
  }
  emit();
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
  emit();
}

export const useAuth = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    read,
  );
