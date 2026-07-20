# Arcade Points

Points calculator and public leaderboard for Google Cloud Arcade Facilitator 2026.

## Features

- Auto-calculates points from a Google Cloud Skills Boost public profile URL
- Public leaderboard with real-time updates (10s polling + per-profile auto-sync)
- Milestone progress tracker with per-requirement breakdown
- Missing skill badges list to reach the next milestone
- Admin panel: hide/show entries, bulk re-sync all profiles
- ID / EN language support

## Stack

- Next.js 14 (App Router)
- Supabase (PostgreSQL)
- Tailwind CSS
- i18next

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SECRET
npm run dev
```

## Points System

| Badge | Points |
|-------|--------|
| Game Badge | +1 per badge |
| Skill Badge | +0.5 (per 2 = 1 pt) |
| Milestone 1 | +7 bonus |
| Milestone 2 | +18 bonus |
| Milestone 3 | +29 bonus |
| Ultimate | +40 bonus |
| GEAR Bonus | +10 (optional) |

## API Routes

| Route | Description |
|-------|-------------|
| `POST /api/leaderboard` | Submit profile (server-verified) |
| `POST /api/leaderboard/refresh` | Re-sync single profile from Google |
| `POST /api/leaderboard/resync` | Bulk re-sync all profiles (admin) |

## Disclaimer

Independent community tool. Not affiliated with Google or Google Cloud.

## License

[AGPL v3](./LICENSE) — free to use and contribute, no commercial use without permission.
