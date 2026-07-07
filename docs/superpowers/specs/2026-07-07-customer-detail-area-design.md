# Customer Detail Area Design

## Goal

Redesign the customer detail area so the page feels like a coherent workspace with a clear hierarchy: customer snapshot first, quick actions second, and activity/history third.

The change covers the whole customer detail area, including the top customer overview and the appointments, notes, and hair sales tabs.

## Constraints

- Keep the work inside the current Mantine and TanStack Router structure.
- Prefer composition and spacing changes over a CSS-heavy redesign.
- Preserve existing route behavior, data loading, and mutations.
- Keep the tabs functional and familiar, but reduce their visual dominance.
- Make only minor style adjustments when they help hierarchy or readability.

## Current Problems

- The customer overview, tabs, and tab content currently feel like separate pages stacked together.
- The snapshot area does not lead strongly enough over the rest of the content.
- Quick actions exist, but they are not organized as a clear action cluster.
- The tab content uses a mix of `Section`, `Card`, `Tabs`, and page-local framing patterns, which makes the area feel uneven.
- The page title, navigation back link, summary stats, and tabs compete for attention instead of forming a single workspace.

## Design Direction

The customer detail area should read in this order:

1. Customer snapshot
2. Quick actions
3. Activity/history

That means the top of the page becomes the primary visual anchor, the actions become immediately available but not louder than the customer identity, and the tabs become a subordinate navigation layer for history.

## Layout System

The new page structure is:

```text
Back link
Customer snapshot band
  Name
  Phone
  Joined date
  Key summary stats
Quick actions row
  Edit customer
  Add note / Add appointment / Add hair sale
Tabs row
  Appointments
  Notes
  Hair sales
Tab panel content
  Sectioned content
  Empty states
  Pagination / list controls
```

### Snapshot Band

This is the main hero of the customer detail area. It should:

- make the customer name the clearest element on the page,
- show contact details and joined date immediately,
- surface the most useful summary stats without overwhelming the page,
- sit above the tabs so the identity of the customer is established before browsing history.

### Quick Actions

The quick actions should feel like a compact control strip rather than a second header. They should:

- include the existing edit action,
- expose the most common create actions when they are available in the current context,
- stay visually lighter than the snapshot band,
- not crowd the tabs or push the page toward a dashboard feel.

### Activity / History

Tabs remain the primary history navigation, but they should be visually calmer than before. The tab content should:

- use the existing route-specific data and mutations,
- keep the current empty states and pagination semantics,
- read like one workspace area instead of three separate mini pages.

## Route-Level Behavior

### `/customers/$customerId`

- This route becomes the customer overview entry point.
- It should keep the back link and edit flow.
- The overview should be the strongest snapshot area on the page.
- Summary metrics should be displayed in a layout that looks intentional, not incidental.

### `/customers/$customerId/appointments`

- Keep the appointments list, search, create dialog, and pagination behavior.
- Reframe the section so it feels subordinate to the snapshot band.
- Keep the list easy to scan, but do not let its control row compete with the page header.

### `/customers/$customerId/notes`

- Keep the notes list and delete/add flows unchanged.
- Make the note cards fit the same page rhythm as the other tab panels.
- Preserve the empty state and paging semantics.

### `/customers/$customerId/hair-sales`

- Keep the split between appointment-tied and individual hair sales.
- Preserve edit/delete/add flows.
- Reframe the nested cards so they sit comfortably inside the customer workspace rather than looking like a separate admin page.

## Component Plan

Use the existing shared primitives as much as possible:

- `PageHeader` remains useful for page titles, but the customer detail route needs a stronger snapshot band above or in place of a generic header.
- `Section` can continue to frame tab panels, but its usage should be consistent across the customer detail tabs.
- `Tabs` should remain the tab navigation mechanism, but with calmer visual weight and better spacing.

Add only small shared helpers if they reduce duplication across the customer detail routes.

## Copy and Content

- Keep labels plain and operational.
- Use sentence case for button text and section titles where possible.
- Surface the most important customer data first: name, phone, joined date, counts.
- Avoid inventing marketing language; this page should feel like a working record.

## Success Criteria

- The page clearly reads as a customer workspace, not just a set of independent tab screens.
- The customer snapshot is the first thing the eye finds.
- Quick actions are easy to access without overpowering the snapshot.
- Tabs are present and clear, but subordinate to the customer identity.
- Existing behavior is preserved for loading, navigation, paging, and mutations.
- The result feels more deliberate without requiring a CSS-heavy rewrite.

## Testing Notes

- Verify the overview route still loads the customer and summary data.
- Verify the tabs still navigate between appointments, notes, and hair sales.
- Verify the edit customer flow still opens and saves correctly.
- Verify create, delete, and pagination behavior still work in each tab.
- Verify the back link still returns to the customer list.

## Decision Log

- Chose snapshot-first because the user explicitly prioritized customer identity ahead of actions and history.
- Kept the redesign whole-area rather than route-by-route because the tabs and overview are visually part of one record experience.
- Kept the scope focused on composition and hierarchy because the app already uses Mantine and the request did not call for a styling-system rewrite.
