# Recon Map

## Sources

| source | url | notes |
| --- | --- | --- |
| Marketing homepage | https://nerdytips.com | Confirmed hero, quick stat messaging, free prediction list, and trust framing. |
| Match listing CTA | https://nerdytips.com/all-matches | Inferred the primary loop is scanning a dense match board and drilling into prediction details. |
| Replica skill workflow | https://github.com/Jakeschincariol/replica-skill | Used the recon -> architect -> design -> build -> test workflow as implementation structure. |

## Scope

- Platform: responsive web app
- Slice: public football prediction dashboard with filters, recommendation confidence, and match detail analytics
- Audience: bettors and football fans screening high-confidence model outputs quickly

## Screen Inventory

| ID | screen | route | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Dashboard shell | `/` | Show quick stats, filters, and prediction board | header, stat tiles, filter controls | default, filtered, empty |
| S02 | Match card list | `/` | Present each fixture with probabilities and recommendation | league badge, team row, probability blocks, CTA | default, long text, dense list |
| S03 | Match detail drawer | `/` | Expand one match into xG, form, and notes | modal/drawer, form chips, stats grid | open, closed |
| S04 | Design system preview | `/design` | Isolate tokens and primitives | swatches, card primitive | default |

## User Flows

F01 Scan top opportunities
    S01 dashboard shell -> S02 match card list
    edge: filter results to zero, narrow confidence threshold

F02 Investigate a single fixture
    S02 match card list -> S03 match detail drawer
    edge: close via overlay, close via button

F03 Validate the visual system
    S01 dashboard shell -> S04 design system preview
    edge: inspect token surfaces on smaller screens

## Component Inventory

- Header hero with quick stat tiles
- Date pill group
- League, market, and confidence selects
- Match card
- Probability bar block
- Recommendation badge
- Detail drawer
- Recent-form chips

## Inferred Data Model

`Match`
- `id`, `date`, `dateLabel`, `dateBucket`, `kickoffUtc`, `venue`
- evidence: dashboard list and date filters
- confidence: high

`League`
- `name`, `country`, `badgeText`, `badgeTone`
- evidence: league chips and grouping behavior
- confidence: high

`ProbabilitySet`
- `home`, `draw`, `away`, `over25`, `under25`, `bttsYes`, `bttsNo`
- evidence: visible percentage-driven recommendation patterns
- confidence: high

`Recommendation`
- `market`, `selection`, `confidence`, `rating`, `rationale`
- evidence: confidence-led badges and summarized pick language
- confidence: high

`Analytics`
- `xg`, `recentForm`, `headlineStats`, `tacticalNotes`
- evidence: detail view requirement and model-explanation behavior
- confidence: high

## Out Of Scope

- Paid plans, accounts, payments, or proprietary back-office tooling
- Original branding, copy, logos, or copyrighted assets
- Live data ingestion and settlement tracking

## Size

- Screens: 4
- Flows: 3
- Entities: 5 nested data structures
- Hard parts: keeping filters intuitive, making dense cards readable, and preserving strong dark-theme contrast
- Size: S
