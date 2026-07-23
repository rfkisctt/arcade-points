<p align="center">
  <img src="./public/logo.png" width="80" alt="Arcade Points Logo" />
</p>

<h1 align="center">Arcade Points</h1>

<p align="center">
  <em>Points calculator & public leaderboard for Google Cloud Arcade Facilitator 2026.</em>
</p>

<p align="center">
  <a href="https://arcade-pts.vercel.app"><img src="https://img.shields.io/badge/live-arcade--pts.vercel.app-FCAA26?style=flat-square&logo=vercel&logoColor=white" alt="Live Site"></a>
  <img src="https://img.shields.io/github/stars/rfkisctt/arcade-points?style=flat-square&color=FCAA26&label=stars" alt="Stars">
  <img src="https://img.shields.io/github/last-commit/rfkisctt/arcade-points?style=flat-square&color=555&label=last+commit" alt="Last Commit">
  <img src="https://img.shields.io/badge/license-AGPL%20v3-555?style=flat-square" alt="License">
</p>

<p align="center">
  <a href="https://arcade-pts.vercel.app">arcade-pts.vercel.app</a>
</p>

---

## Features

- **Auto-calculate points** — paste your Google Cloud Skills Boost public profile URL and get your score instantly
- **Public leaderboard** — real-time rankings with 10s polling and per-profile auto-sync
- **Milestone tracker** — see your progress toward Milestone 1 → Ultimate with exact badge requirements
- **Badge inventory** — browse all earned badges, filter by category, search by title
- **Points history** — track score changes over time with local snapshots
- **Profile sharing** — shareable public profile pages with Open Graph preview
- **ID / EN** — full Bahasa Indonesia and English support

## Points System

| Badge Type | Points |
|---|---|
| Game Badge | +1 per badge |
| Skill Badge | +0.5 (every 2 = 1 pt) |
| Trivia | 0 |
| Milestone 1 (6 Game, 14 Skill) | +7 bonus |
| Milestone 2 (8 Game, 28 Skill) | +18 bonus |
| Milestone 3 (10 Game, 42 Skill) | +29 bonus |
| Ultimate (12 Game, 56 Skill) | +40 bonus |
| GEAR Bonus | +10 (optional) |

## Stack

- **[Next.js 14](https://nextjs.org)** — App Router, server components, API routes
- **[Supabase](https://supabase.com)** — PostgreSQL for leaderboard data and badge cache
- **[Tailwind CSS](https://tailwindcss.com)** — utility-first styling
- **[i18next](https://www.i18next.com)** — ID / EN i18n

## Getting Started

```bash
git clone https://github.com/rfkisctt/arcade-points.git
cd arcade-points
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_SECRET=your_admin_secret
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/fetch-profile` | Fetch and parse a Google Cloud Skills Boost profile |
| `POST` | `/api/leaderboard` | Submit profile to leaderboard (server-verified) |
| `POST` | `/api/leaderboard/refresh` | Re-sync a single profile from Google |
| `POST` | `/api/leaderboard/resync` | Bulk re-sync all profiles (admin) |
| `PATCH` | `/api/leaderboard/visibility` | Show/hide a leaderboard entry (admin) |
| `GET` | `/api/profile/[slug]` | Get public profile data by slug |
| `GET` | `/api/badge-image` | Proxy and classify badge images |

## Project Structure

```
app/
├── api/              # API routes
├── calculate/        # Points calculator page
├── courses/          # Badge & course list
├── leaderboard/      # Public leaderboard
├── profile/[slug]/   # Public profile pages
components/           # Shared UI components
lib/                  # Utils, types, constants, i18n
public/               # Static assets
```

## Disclaimer

This is an independent community tool. Not affiliated with, endorsed by, or connected to Google or Google Cloud in any way.

## License

[AGPL v3](./LICENSE) — free to use and contribute. No commercial use without permission.
