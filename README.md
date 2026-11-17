# PIPDC Real Estate Platform — Frontend

React + TypeScript single-page app for a full-stack real-estate platform. It includes a public property site, an AI property concierge, real-time messaging, and role-based dashboards for users, agents, and admins.

> **Portfolio demo project.** This is a personal portfolio project built by Simon Agboji with sample data. It is **not affiliated with, endorsed by, or built for the real PIPDC** or any government body.

**Live demo:** [pipdc-frontend.onrender.com](https://pipdc-frontend.onrender.com) · **Backend repo:** [PIPDC/Pipdc-Backend](https://github.com/PIPDC/Pipdc-Backend)

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Routes](#routes)
- [Deployment](#deployment)

## Features

**Public site**
- Property search and detail pages with images, filters, a map, and "near you" suggestions
- Development projects with progress updates and units
- Agent directory, agent profiles, and an "apply to become an agent" flow
- Blog, about, and contact pages

**Signed-in experience**
- **AI property concierge** — chat drawer and full-page assistant that finds listings and hands off to the team when needed
- **Real-time messaging** with agents over SignalR, including unread-message notifications
- Saved properties, enquiries, purchases, tenancies, and tracked developments

**Dashboards (role-based)**
- **Agent:** listings, enquiries, conversations, and transactions
- **Admin:** users, agents and applications, appeals, reports, escalations, locations, blog, developments, tenants and purchasers, and statistics

**Auth** — register, email verification, login, forgot/reset password, and JWT refresh. Routes are protected by role.

## Tech stack

| Area | Technology |
|---|---|
| Framework | React 18, TypeScript, Vite 5 |
| Routing | React Router 7 |
| Server state | TanStack Query 5, Axios |
| Forms & validation | React Hook Form, Zod |
| Real-time | `@microsoft/signalr` |
| Styling & UI | Tailwind CSS, Framer Motion, Heroicons, Lucide |
| Content | React Markdown (blog) |
| Bot protection | Cloudflare Turnstile (optional) |

## Getting started

### Prerequisites

- Node.js 20 or later
- The [backend API](https://github.com/PIPDC/Pipdc-Backend) running locally (see its README)

### 1. Clone and install

```bash
git clone https://github.com/PIPDC/Pipdc-Frontend.git
cd Pipdc-Frontend
npm install
```

### 2. Configure the environment

```bash
cp .env.example .env
```

By default, `VITE_API_URL` points to the backend's HTTP launch profile: `http://localhost:5123/api/v1`. If you run the backend with its HTTPS profile, use `https://localhost:7123/api/v1` instead.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). This origin is already allowed by the backend's development CORS settings.

## Environment variables

| Variable | Description | Required |
|---|---|---|
| `VITE_API_URL` | Backend base URL **including** `/api/v1` | Yes |
| `VITE_TURNSTILE_ENABLED` | `true` to show the Cloudflare Turnstile challenge | No (default `false`) |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile site key (the example uses Cloudflare's test key) | Only when Turnstile is enabled |

> Turnstile must be enabled on **both** the frontend and the backend (`Turnstile:Enabled`), or the challenge result is ignored.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Project structure

```
src/
├── components/     UI building blocks
│   ├── ai/           AI concierge drawer and chat panel
│   ├── dashboard/    dashboard shell and role-based sections
│   ├── messaging/    real-time conversations
│   ├── routing/      auth and role guards
│   └── ui/           shared primitives
├── contexts/       Auth and real-time (SignalR) providers
├── hooks/          TanStack Query hooks and listeners
├── pages/          Public, auth, blog, and dashboard pages
├── services/       Typed API clients, one per backend area
├── lib/            Turnstile loader
├── types/          Shared TypeScript types
└── utils/          Formatting, status labels, role helpers
```

## Routes

| Path | Page |
|---|---|
| `/` | Home |
| `/properties`, `/properties/:slug` | Listings and property detail |
| `/developments`, `/developments/:slug` | Development projects |
| `/agents`, `/agents/:id`, `/apply-agent` | Agents |
| `/assistant` | AI concierge |
| `/blog`, `/blog/:slug` | Blog |
| `/about`, `/contact` | Info pages |
| `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | Auth |
| `/dashboard/*` | Role-based dashboard (messages, saved, enquiries, properties, users, and more) |

## Deployment

The live demo is hosted on **Render** as a static site:

- **Build command:** `npm install && npm run build`
- **Publish directory:** `dist`
- **Environment variable:** set `VITE_API_URL` to the deployed API (including `/api/v1`)
- **Rewrite rule:** `/*` → `/index.html`, so client-side routes work on refresh

## Author

**Simon Agboji** — Software Engineer (C# · ASP.NET Core)
[Portfolio](https://simon-a.netlify.app) · [GitHub](https://github.com/agbojisimon) · [LinkedIn](https://www.linkedin.com/in/agboji-simon)
