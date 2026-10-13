# Test Plan

## F01 Scan top opportunities

- F01-H1: Load `/` and confirm stat tiles, filters, and a sorted match list render from local data
- F01-H2: Switch date pills between today, tomorrow, past, and all and confirm list updates
- F01-E1: Apply a narrow league plus high confidence threshold and confirm list shrinks
- F01-E2: Apply a filter combination with no matches and confirm the empty state message appears

## F02 Investigate a single fixture

- F02-H1: Open a match detail drawer from a card and confirm xG, recent form, stats, and notes display
- F02-E1: Close the drawer with the overlay
- F02-E2: Close the drawer with the button

## F03 Validate the visual system

- F03-H1: Open `/design` and confirm semantic swatches render
- F03-H2: Confirm the primary match card primitive renders without runtime errors

## Build Validation

- Run `npm run lint`
- Run `npm run build`
