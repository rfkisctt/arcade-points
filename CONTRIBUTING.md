# Contributing

Thanks for your interest in contributing to Arcade Points.

## Getting Started

1. Fork the repository
2. Clone your fork and install dependencies:
   ```bash
   git clone https://github.com/your-username/arcade-points.git
   cd arcade-points
   npm install
   cp .env.local.example .env.local
   ```
3. Create a branch:
   ```bash
   git checkout -b feat/your-feature
   ```
4. Make your changes, then open a pull request to `main`.

## Guidelines

- Keep PRs focused — one feature or fix per PR
- Match the existing code style (TypeScript, Tailwind, no new dependencies without discussion)
- Test your changes locally with `npm run dev` before submitting
- If you're fixing a bug, describe how to reproduce it in the PR description

## What to Contribute

- Bug fixes
- New Arcade 2026 badge/course data in `lib/courses.ts`
- Translation improvements (`public/locales/`)
- UI improvements

## What NOT to Do

- Don't add tracking, ads, or monetization features
- Don't submit AI-generated code dumps without review
- Don't change the license or remove attribution

## Questions

Open an issue or reach out via the community links in the app footer.
