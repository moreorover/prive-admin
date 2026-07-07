# Customers Page Design

## Goal

Redesign the customer list experience in the authenticated app so it reads more clearly and feels more deliberate, while staying inside the existing Mantine-based system.

The first variant keeps `/customers` calm and information-first. The second variant, `/customers2`, adds contextual summary information so the page feels more operational and dashboard-like.

## Constraints

- Keep the work scoped to composition and layout first.
- Avoid introducing a new CSS-heavy styling system.
- Make only minor style adjustments when they create clearer hierarchy.
- Stay aligned with the app's current Mantine components and authenticated shell.

## Existing Problems

- The current customers page puts the search input, table, and pagination in one visually flat section.
- The table header and page-level heading compete for attention instead of forming a clear hierarchy.
- Pagination feels attached to the table instead of reading as a separate navigation control.
- The page does not yet give a strong sense of title, context, and action order.

## Design Direction

The redesign uses the same page skeleton for both variants:

1. Page title and short description.
2. Primary action.
3. Search/control row.
4. Table card.
5. Pagination footer.

The difference is in the top band:

- `/customers` keeps the top band informational only.
- `/customers2` adds customer count and current filter state so the page feels more like a live operations view.

## Variant A: `/customers`

### Intent

This is the cleaner, calmer version. It should feel easy to read and quick to use.

### Layout

```text
Page header
  Title
  Description
  Primary action

Control row
  Search input
  Small page hint or nothing else

Table card
  Table header
  Customer rows
  Empty state

Footer row
  Pagination label
  Pagination controls
```

### Composition Rules

- Keep the page header separate from the table card.
- Put search in its own row so it reads as a tool, not part of the table.
- Give the table its own card boundary.
- Keep pagination visually below the table and distinct from the data area.
- Preserve the current customer row behavior, including linking names to detail pages.

### Visual Tone

- Calm.
- Sparse.
- Strong hierarchy without extra decoration.
- Small spacing and weight adjustments are fine if they help the section boundaries read better.

## Variant B: `/customers2`

### Intent

This version should feel like a more operational list page, with extra context up top.

### Layout

```text
Page header
  Title
  Description
  Primary action

Summary strip
  Total customer count
  Active search state

Control row
  Search input

Table card
  Table header
  Customer rows
  Empty state

Footer row
  Pagination label
  Pagination controls
```

### Composition Rules

- Keep the summary strip compact so it adds context without becoming a second hero section.
- Show the current search/filter state when a search is active.
- Make the count feel like live feedback rather than a decorative stat.
- Keep the rest of the page structure identical to `/customers` so the comparison is isolated to hierarchy and emphasis.

### Visual Tone

- More structured.
- More dashboard-like.
- Slightly denser than `/customers`, but not noisy.

## Shared Implementation Boundaries

- Reuse the existing customer list data loader and query logic.
- Reuse the existing create-customer dialog.
- Keep the customer name link behavior unchanged.
- Preserve the current paging semantics.
- Prefer small component extraction only if it helps reuse the page frame between the two variants.

## Component Plan

Create or adjust shared page primitives only if needed:

- A clearer page frame for header, controls, content, and footer.
- A compact summary component for the contextual variant.
- A table wrapper that gives the data grid more presence without changing table semantics.

Do not introduce a new design system layer. The goal is to improve composition, not replace Mantine.

## Success Criteria

- `/customers` reads more clearly than the current page.
- `/customers2` is visually distinct from `/customers` while staying in the same app language.
- The table no longer blends into the header and pagination.
- The page remains responsive and usable on smaller screens.
- No large CSS rewrite is needed.

## Testing Notes

- Verify both routes render in the authenticated shell.
- Confirm search still resets paging to page 1.
- Confirm pagination still navigates correctly.
- Confirm empty states still work for both filtered and unfiltered lists.
- Verify the customer detail link still opens the correct record.

## Decision Log

- Chose two variants because the user explicitly wanted to compare a simpler version and a more contextual one.
- Kept styling changes minor because the app already uses Mantine and the request prioritized composition.
- Kept the scope page-specific so the result can become a pattern later without forcing a full app redesign.
