# PS PRO Gaming — Premium Gaming Café Management Platform

A modern, production-ready web application and management system built for high-end console gaming cafés and simulation centers. Featuring a public-facing booking portal and a comprehensive admin operations panel for live station monitoring, multi-player session tracking, dynamic hourly billing, and financial reporting.

---

## 🌟 Key Features

### 🎮 1. Public Customer Experience & Booking Portal
- **High-Impact Brand Presentation**: Cyberpunk-inspired dark aesthetic with neon blue/orange accents, metallic 3D branding, and smooth micro-animations.
- **Live Station Availability Counter**: Real-time stats on hero section showing available PS5 stations and pro racing rigs.
- **Game Showcase**: Filterable game library (EA Sports FC, Gran Turismo 7, Tekken 8, etc.) with player count badges and genre tags.
- **Hardware & Lounge Showcase**: Interactive highlights of 4K displays, DualSense Edge controllers, Fanatec Direct Drive sim-racing wheelbases, and ergonomic gaming lounges.
- **Transparent Pricing Cards**: Clear hourly rates, multiplayer discounts, and simulator rates with no hidden fees.
- **Direct Online Booking**:
  - Date & time slot picker with double-booking prevention.
  - Multi-station selection (PS5 Stations 1–3, Sim Racing Rig).
  - Player headcount and game selection.
  - Automatic WhatsApp booking confirmation dispatch with pre-filled message templates.

---

### 🕹️ 2. Admin Operations & Live Session Management
- **Today's Overview KPI Dashboard**:
  - Live active session count.
  - Upcoming bookings queue for the day.
  - Available vs. occupied station counters.
  - Outstanding balances and pending payments counter.
  - Real-time today's revenue total.
- **Quick Station Controls**: Set station states on the fly (`Available`, `Playing`, `Booked`, `Cleaning`, `Disabled`).
- **Live Session Timer & Controller**:
  - One-click session start/pause/resume/end.
  - Live elapsed time stopwatch.
  - Dynamic billing calculation updating in real time.
- **Per-Player Tracking in Group Bookings**:
  - Add or remove players dynamically as friends join or leave mid-session.
  - Track individual player start times and end times.
  - Calculate prorated charges per player based on their individual play duration.
  - Custom amount and rate overrides per player when needed.

---

### 💳 3. Payment Processing & Financial Safeguards
- **Flexible Payment Methods**: Record Cash (Offline), UPI/Card (Online), or Split Payments across both methods.
- **Group or Individual Attribution**: Allocate payments to the entire group or directly to specific players.
- **Payment Verification Gate**:
  - Sessions cannot be submitted or finalized into history until the balance is fully settled (`Remaining = ₹0`).
  - Active visual warnings and automatic redirection to the payment dialog when dues remain.
- **Transaction History**: Audit trail of all payments with transaction references, timestamps, and cashier notes.

---

### 📊 4. Analytics & Historical Dashboard
- **Revenue Analytics**: Daily, weekly, and monthly revenue performance with interactive Recharts visualisations.
- **Station Utilization**: Usage breakdown across PS5 stations and the racing simulator.
- **Peak Hours Heatmap**: Identify peak gaming hours to optimize staff scheduling and promotional pricing.
- **Booking Channels**: Breakdown of booking sources (Website, Walk-in, WhatsApp, Phone, Admin).
- **Completed Sessions Archive**:
  - Filter by date range, customer name, station, or payment status.
  - Displays true session start and end timestamps.
  - Accurate session duration vs. total cumulative player-minutes.
  - Complete financial breakdown (online, cash, total, balance).

---

### ⚙️ 5. Administrative Utilities & Data Portability
- **JSON Database Backup & Restore**: One-click database export to JSON and instant restore from file.
- **Seed Data Management**: Fast reset to realistic demo data for testing, or wipe to a clean blank state.
- **Pricing Rule Engine**: Configurable base hourly rates, group minimum player thresholds, and minimum billing increments per station type.
- **Secure Staff Authentication**: Session-based staff sign-in with customizable credentials stored securely.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite 8](https://vite.dev/) with Fast Refresh |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite` |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Data Visualisation** | [Recharts 3](https://recharts.org/) |
| **Client Routing** | [React Router 7](https://reactrouter.com/) |
| **Code Formatting** | [oxfmt](https://oxc.rs/) |
| **Persistence** | LocalStorage state engine with multi-tab broadcast synchronization |

---

## 📁 Project Architecture

```
├── public/
│   └── logo.jpg               # Static brand logo and browser favicon
├── src/
│   ├── admin/                 # Admin management system
│   │   ├── components/        # Admin UI modules
│   │   │   ├── AdminLayout.tsx       # Header, navigation, backup/restore bar
│   │   │   ├── BookingCard.tsx       # Core booking lifecycle & timer card
│   │   │   ├── BookingFormModal.tsx  # Add / edit / reschedule booking modal
│   │   │   ├── CredentialsModal.tsx  # Change admin username & password
│   │   │   ├── HistoryTable.tsx      # Archive table of completed sessions
│   │   │   ├── PaymentModal.tsx      # Split payment & allocation modal
│   │   │   ├── PlayerList.tsx        # Per-player timing & status list
│   │   │   ├── PricingModal.tsx      # Station hourly rates editor
│   │   │   ├── SessionTimer.tsx      # Live timer display & controls
│   │   │   └── StatusBadge.tsx       # Color-coded status pills
│   │   └── pages/
│   │       ├── BookingManagement.tsx # Active bookings & live stations view
│   │       ├── History.tsx           # Financial charts & session history
│   │       └── Login.tsx             # Staff authentication page
│   ├── assets/                # Bundled graphics and assets
│   ├── components/            # Customer-facing public components
│   │   ├── public/
│   │   │   ├── BookingCTA.tsx        # Call-to-action banner
│   │   │   ├── BookingForm.tsx       # Customer booking portal form
│   │   │   ├── Experience.tsx        # Lounge & setup showcase
│   │   │   ├── Footer.tsx            # Footer & legal / contact info
│   │   │   ├── Games.tsx             # Game catalogue
│   │   │   ├── Hero.tsx              # Landing hero with live stats
│   │   │   ├── Navbar.tsx            # Navigation bar with responsive drawer
│   │   │   ├── Pricing.tsx           # Transparent pricing tables
│   │   │   ├── SimRacing.tsx         # Pro sim-racing rig spotlight
│   │   │   ├── Stations.tsx          # Station specifications
│   │   │   └── VRComingSoon.tsx      # VR Zone coming soon section
│   │   └── ui/                       # Reusable UI primitives (Modal, Toast, BusyButton)
│   ├── config/
│   │   └── brand.ts           # Global brand settings (name, address, contacts)
│   ├── lib/                   # Business logic and domain engines
│   │   ├── analytics.ts       # Revenue, utilization & peak hours math
│   │   ├── api.ts             # Transactional state API layer
│   │   ├── auth.ts            # Staff auth & session state
│   │   ├── conflicts.ts       # Booking conflict & overlap detection
│   │   ├── pricing.ts         # Dynamic pricing & prorated player calculations
│   │   ├── seed.ts            # Default seed data and factory helpers
│   │   ├── store.ts           # Reactive state container with multi-tab sync
│   │   └── time.ts            # Date & duration formatting utilities
│   ├── App.tsx                # Route definitions & application wrapper
│   ├── index.css              # Tailwind v4 import & custom styling
│   └── main.tsx               # React application entrypoint
├── index.html                 # HTML shell & SEO meta configuration
├── package.json               # Dependencies and build scripts
├── vite.config.ts             # Vite configuration with React & Tailwind
└── tsconfig.json              # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or `pnpm`

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/sujalvende/Advance-admin-panel-gaming-cafe.git
   cd Advance-admin-panel-gaming-cafe
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Staff Credentials

Default staff credentials for testing the management panel:

| Field | Value |
|---|---|
| **Admin URL** | `/admin` or `/admin/login` |
| **Email** | `owner@respawn.example` |
| **Password** | `respawn-admin` |

*(Credentials can be updated anytime inside the Admin Header via the Key icon).*

---

## 📦 Build & Deployment

To create an optimized production build:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

### Deploying to Vercel
This repository is pre-configured for instant zero-configuration deployment on [Vercel](https://vercel.com):
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Web assets in `src/assets/` and `public/` are served directly with proper binary encoding (no Git LFS dependencies required).

---

## 📄 License
Private repository / Proprietary. All rights reserved.
