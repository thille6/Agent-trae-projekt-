# Components

## Match Card

- Variants: default
- States: default, hover, long-text, mobile
- Tokens: `surface`, `panel`, `border`, `accent`, `muted`
- A11y: semantic article, real buttons for drawer triggers, readable percentages

## Probability Block

- Variants: 1X2, O/U 2.5, BTTS
- States: full data, narrow viewport
- Tokens: `panel`, `background`, `accent`, `foreground`, `muted`
- A11y: label-first rows so each progress bar stays understandable without color

## Recommendation Badge

- Variants: low, medium, high confidence
- States: default
- Tokens: `warning`, `accent`, `success`
- A11y: confidence text is always explicit, not color-only

## Filter Controls

- Variants: pill button group, select input
- States: selected, unselected, focus-visible
- Tokens: `panel`, `background`, `border`, `accent`
- A11y: native buttons and selects preserve keyboard and screen reader support

## Detail Drawer

- Variants: open, closed
- States: overlay dismiss, button dismiss
- Tokens: `surface`, `panel`, `border`, `overlay`
- A11y: dialog semantics with explicit close controls
