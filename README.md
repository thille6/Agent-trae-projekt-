# Apex Football Tips

A Next.js 16 football prediction dashboard inspired by NerdyTips. The app pulls real public fixture data, computes probability models on the server, and renders a dark sports analytics interface with filters, confidence scores, and match detail drawers.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Lucide React
- Public football data from TheSportsDB

## Local Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open [http://localhost:3000](http://localhost:3000) in the same environment where the server is running.

## Scripts

- `npm run dev` starts the Next.js dev server
- `npm run lint` runs ESLint
- `npm run build` creates a production build
- `npm run start` serves the production build

## Routes

- `/` live prediction dashboard
- `/design` design-system preview
- `/api/predictions` server-generated prediction feed

## GitHub Build

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml`.

It runs on every push to `main` or `master`, and on every pull request:

```text
npm ci
npm run lint
npm run build
```

## Publish From GitHub

1. Create a new empty GitHub repository.
2. Upload this project to that repository.
3. Import the repository into Vercel.
4. Deploy with the default settings.

Vercel detects Next.js automatically, so no extra backend or database setup is required for the current version of the app.

## Push Commands

Run these commands locally after you create your GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

## Notes

- The app uses public keyless endpoints, so there is no API key setup.
- Prediction percentages are computed in the app backend from live fixtures, standings, form, and Poisson-based scoring.
- The in-memory cache helps reduce upstream requests and provides stale fallback behavior during temporary network issues.
