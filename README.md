# TrackSolid Pro API Integration — FleetView

> A fast, modern **fleet tracking dashboard** built on the **TrackSolid Pro (JIMI IoT) Open API**. Live GPS tracking, trip playback, interactive geofencing, alarms, reports and remote device management — in one clean web app.

Built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, **shadcn/ui** and **Leaflet**.

---

## ✨ Features

- 🔐 **Secure login** with your TrackSolid Pro account — credentials are verified against the Open API and never stored in plain text (AES‑256‑GCM encrypted session cookies).
- 🛰️ **Live map** — real‑time vehicle positions with auto‑refresh, online/offline status, speed, heading and ACC state.
- 🛣️ **Trip playback** — replay any device's route over a time range with an animated marker and distance summary.
- 📍 **Interactive geofencing** — draw **circular** or **polygon** fences directly on the map, save them, and bind devices with enter/exit alerts.
- 🔔 **Alarms** — query overspeed, SOS, vibration, power and geo alerts per device or fleet‑wide.
- 📊 **Reports** — mileage (computed from track points), trips, parking/idling, RFID and geofence duration.
- 🎛️ **Remote commands & media** — send instructions and pull live‑stream / snapshot URLs for capable devices.
- 🩺 **Diagnostics** — device detail and OBD telemetry / fault codes.
- 👥 **Accounts** — browse sub‑accounts and device groups.

## 🧱 Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) · React 19 |
| Styling | Tailwind CSS v4 · shadcn/ui · Base UI |
| Maps | Leaflet · React‑Leaflet · OpenStreetMap tiles |
| Auth/session | Encrypted cookie sessions (Node `crypto`, AES‑256‑GCM) |
| Data source | TrackSolid Pro / JIMI IoT Open API |

## ⚙️ How it works

```
Browser ──▶ Next.js (App Router)
   │            │
   │   proxy.ts (route protection / session check)
   │            │
   │   /api/tracksolid/call  ── authenticated proxy
   │            │   • reads encrypted session cookie
   │            │   • injects account-scoped params (account / target)
   │            │   • signs the request (MD5) & attaches access token
   ▼            ▼
shadcn UI ──▶ TrackSolid Pro Open API  (jimi.* methods)
```

1. **Login** posts your TrackSolid account + password to a Server Action, which calls `jimi.oauth.token.get`. On success it stores an **encrypted, HTTP‑only session cookie** containing the account, display name and a cached access token.
2. **`proxy.ts`** (Next.js 16's middleware) guards every page — unauthenticated requests are redirected to `/login`.
3. All TrackSolid calls go through a single authenticated route handler (`/api/tracksolid/call`) that signs requests, injects the access token, and adds the correct account‑scope parameter per method. The token is cached in the session cookie to avoid the heavily rate‑limited token endpoint.
4. The UI is split into focused pages — **Live, Devices, Playback, Geofences, Alarms, Reports, Commands, Diagnostics, Accounts** — sharing one live fleet data context.

## 🚀 Getting started

### Prerequisites

- Node.js 20+
- A **TrackSolid Pro Open API** credential (app key/secret) and an account on your regional API node.

### Installation

```bash
git clone https://github.com/numan682/tracksolid-pro-api-integration-nextjs.git
cd tracksolid-pro-api-integration-nextjs
npm install
cp .env.example .env.local   # then fill in your credentials
npm run dev                  # http://localhost:3000
```

### Environment variables

Create `.env.local` (see [`.env.example`](.env.example)):

```env
# Tracksolid Pro Open API credentials
TRACKSOLID_ACCOUNT=your_account
TRACKSOLID_PASSWORD=your_password_or_md5   # plain text or 32-char MD5
TRACKSOLID_APP_KEY=your_app_key
TRACKSOLID_APP_SECRET=your_app_secret
TRACKSOLID_API_URL=https://bgd.tracksolidpro.com/route/rest   # your region's node

# App session — encrypts session cookies (generate with: openssl rand -hex 32)
SESSION_SECRET=replace_with_a_long_random_string
```

| Variable | Required | Description |
| --- | --- | --- |
| `TRACKSOLID_ACCOUNT` | ✅ | Account that owns the Open API credential |
| `TRACKSOLID_PASSWORD` | ✅ | Account password (plain text or MD5 hash) |
| `TRACKSOLID_APP_KEY` | ✅ | Open API app key |
| `TRACKSOLID_APP_SECRET` | ✅ | Open API app secret |
| `TRACKSOLID_API_URL` | ✅ | Regional API base URL (`/route/rest`) |
| `SESSION_SECRET` | ✅ | 32+ char random string for cookie encryption |

## 🐳 Docker

The image uses Next.js **standalone** output for a small, production‑ready container that runs as a non‑root user.

### 1. Install Docker

- **Windows / macOS:** install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- **Linux:** install [Docker Engine](https://docs.docker.com/engine/install/) (includes the `docker compose` plugin).

Verify it's working:

```bash
docker --version
docker compose version
```

### 2. Get the code & configure environment

```bash
git clone https://github.com/numan682/tracksolid-pro-api-integration-nextjs.git
cd tracksolid-pro-api-integration-nextjs
cp .env.example .env.local   # then fill in your TrackSolid credentials
```

### 3. Run with Docker Compose (recommended)

```bash
docker compose up --build -d     # build the image and start in the background
```

Open **http://localhost:3000**. To follow logs or stop:

```bash
docker compose logs -f           # view logs
docker compose down              # stop and remove the container
```

### 4. Or use plain Docker

```bash
docker build -t fleetview .
docker run -d -p 3000:3000 --env-file .env.local --name fleetview fleetview
```

### 5. Or pull the prebuilt image (GitHub Container Registry)

Every push to `main` publishes an image via GitHub Actions:

```bash
docker run -d -p 3000:3000 --env-file .env.local \
  ghcr.io/numan682/tracksolid-pro-api-integration-nextjs:main
```

> **Note:** the container needs the same environment variables as local development — pass them with `--env-file .env.local` (Docker) or `env_file` (Compose). Never bake secrets into the image.

## 📦 Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the project |

## 🗂️ Project structure

```
src/
  app/
    (app)/            Authenticated dashboard pages (live, devices, playback, …)
    login/            Public login page
    api/tracksolid/   Authenticated Open API proxy route
    actions/          Server Actions (login / logout)
  components/         UI, map, fleet provider, shared widgets
  lib/                Tracksolid client, session, normalizers, method scoping
  proxy.ts            Route protection (Next.js 16 middleware)
```

## 🔒 Security notes

- Credentials are validated directly against TrackSolid; the app keeps only an **encrypted** session cookie.
- All Open API calls run **server‑side** — your app key/secret are never exposed to the browser.
- Never commit `.env.local`. It is git‑ignored by default.

## 📄 License

Released under the MIT License.
