# Architecture

## Stack

| layer | choice | why |
| --- | --- | --- |
| web app | Next.js App Router + TypeScript | Matches requested stack and keeps the shell simple. |
| styling | Tailwind CSS v4 + semantic CSS variables | Enables token-driven dark UI without raw color sprawl in components. |
| icons | Lucide React | Open icon set that fits the analytics UI and clean-room constraint. |
| data layer | local JSON + typed loader utilities | Renders out of the box with deterministic build-time data. |
| hosting target | any Next-compatible host | No backend coupling in this implementation. |

## Route Plan

| route | purpose | flow |
| --- | --- | --- |
| `/` | main prediction dashboard | F01, F02 |
| `/design` | token and primitive preview | F03 |

## Data Model

### `MatchRecord`

- Identity: `id`
- Scheduling: `date`, `dateLabel`, `dateBucket`, `kickoffUtc`, `venue`
- Teams: `homeTeam`, `awayTeam`
- League: `league.name`, `league.country`, `league.badgeText`, `league.badgeTone`
- Model output: `probabilities`, `recommendation`, `xg`
- Context: `recentForm`, `headlineStats`, `tacticalNotes`

## API / Data Access

| method | path | purpose | input | output |
| --- | --- | --- | --- | --- |
| build-time import | `data/matches.json` | ship complete fixture board locally | none | `MatchRecord[]` |
| utility | `getMatches()` | read the seed dataset | none | `MatchRecord[]` |
| utility | `sortByConfidence()` | rank visible cards | match list | sorted list |
| utility | `getUniqueLeagues()` | populate league filter | match list | league names |

## Risk Notes

- Density: three probability groups plus recommendation copy can become unreadable on small screens.
- Interactivity boundary: filters and drawer belong in a single client component while the page remains server-rendered.
- Token discipline: semantic classes must drive the dark theme consistently to avoid ad hoc color drift.

## Build Order

1. Vertical slice: typed data model, seed data, and one interactive dashboard route
2. Must-haves: match cards, filter engine, recommendation sorting, detail drawer
3. Should-haves: xG, form chips, tactical notes, design route
4. Verification: lint and production build until clean
