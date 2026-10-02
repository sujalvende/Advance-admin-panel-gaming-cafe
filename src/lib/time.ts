const pad = (n: number) => String(n).padStart(2, "0");

export const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return todayStr(d);
};

export const toMs = (date: string, time: string) => new Date(`${date}T${time}:00`).getTime();

export const addMinutesToTime = (time: string, mins: number) => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const days = Math.floor(total / 1440);
  const t = ((total % 1440) + 1440) % 1440;
  return { time: `${pad(Math.floor(t / 60))}:${pad(t % 60)}`, days };
};

export const fmtTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

export const fmtClock = (iso: string | null) =>
  iso ? fmtTime(`${pad(new Date(iso).getHours())}:${pad(new Date(iso).getMinutes())}`) : "—";

export const fmtDate = (date: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...opts,
  });

export const fmtDateLabel = (date: string) => {
  const t = todayStr();
  if (date === t) return "Today";
  if (date === addDays(t, 1)) return "Tomorrow";
  if (date === addDays(t, -1)) return "Yesterday";
  return fmtDate(date);
};

export const fmtDur = (mins: number) => {
  const m = Math.max(0, Math.round(mins));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
};

export const fmtHours = (mins: number) => `${(mins / 60).toFixed(1)} h`;

export const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const fmtHMS = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

export const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${todayStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

export const startOfWeek = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  const day = (d.getDay() + 6) % 7; // Monday start
  d.setDate(d.getDate() - day);
  return todayStr(d);
};
