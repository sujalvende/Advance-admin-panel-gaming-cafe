export type StationType = "ps5" | "sim" | "vr";
export type StationStatus = "available" | "booked" | "playing" | "maintenance" | "disabled";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "delayed"
  | "playing"
  | "completed"
  | "cancelled"
  | "noshow";
export type BookingSource = "website" | "whatsapp" | "phone" | "walkin" | "admin";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";
export type PayType = "online" | "offline";
export type PricingUnit = "hour" | "half_hour";

export interface Station {
  id: string;
  name: string;
  type: StationType;
  status: StationStatus;
  notes: string;
}

export interface Game {
  id: string;
  title: string;
  genre: string;
  image: string;
  multiplayer: string;
  description: string;
  hue: number;
  active: boolean;
}

export interface PricingRule {
  id: string;
  stationType: StationType;
  label: string;
  rate: number; // per player, per hour
  unit: PricingUnit;
  minMinutes: number;
  groupRate: number | null;
  groupMinPlayers: number;
  active: boolean;
}

export interface Player {
  id: string;
  name: string;
  startTime: string | null; // ISO
  endTime: string | null; // ISO
  plannedMinutes: number | null;
  rate: number | null; // frozen when billed
  amount: number | null; // frozen / overridden amount
  overridden: boolean;
  paymentStatus: "unpaid" | "paid";
  paymentMethod: PayType | null;
  notes: string;
}

export interface Payment {
  id: string;
  type: PayType;
  amount: number;
  reference: string;
  time: string;
  notes: string;
}

export interface Booking {
  id: string;
  no: number;
  customerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMin: number;
  stationId: string;
  gameId: string;
  status: BookingStatus;
  source: BookingSource;
  notes: string;
  players: Player[];
  payments: Payment[];
  sessionStartedAt: string | null;
  pausedAt: string | null;
  pausedMs: number;
  sessionEndedAt: string | null;
  refunded: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deletedAt: string | null;
  finalTotal: number | null; // frozen at submit
}

export interface DbState {
  stations: Station[];
  games: Game[];
  rules: PricingRule[];
  bookings: Booking[];
  seq: number;
  version: number;
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  delayed: "Delayed",
  playing: "Playing",
  completed: "Completed",
  cancelled: "Cancelled",
  noshow: "No show",
};
export const SOURCE_LABEL: Record<BookingSource, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  phone: "Phone call",
  walkin: "Walk-in",
  admin: "Admin added",
};
export const STATION_STATUS_LABEL: Record<StationStatus, string> = {
  available: "Available",
  booked: "Booked",
  playing: "Playing",
  maintenance: "Maintenance",
  disabled: "Disabled",
};
