# Atelier Ledger Admin UI Design

## Goal

Redesign the authenticated admin interface around a compact, mobile-friendly top navigation system. The result should feel clearer and more intentional than the current left-sidebar dashboard while preserving the existing route structure and operational speed.

## Context

The current web app uses Mantine AppShell with a persistent left navbar, a slim top header, and page content rendered in `Container size="xl"`. Primary routes include Dashboard, Customers, Calendar, Hair orders, Hair sales, Cash, Legal entities, and Settings. Legal entity detail pages already have local tabs for Overview, Bank accounts, Salons, Reports, and Documents.

The redesign is inspired by Mantine top-header patterns, but it should not copy them directly. It should use the existing Privé visual identity and adapt it to a data-heavy admin workflow.

## Direction: Atelier Ledger Header

Use a two-tier top header on desktop:

- First row: Privé brand, compact app context, color scheme toggle, and user menu.
- Second row: primary route tabs for the main admin destinations.
- A thin ledger-style rule beneath the tabs carries the active route label and, when present, route badges such as unassigned documents.
- Main content starts directly below the header with more horizontal space than the sidebar layout.

Use a drawer on mobile:

- The header remains one compact row with brand, burger, color scheme toggle, and user menu.
- The burger opens grouped navigation: Workspace, Manage, Account.
- The drawer mirrors the same route semantics as desktop tabs.

## Visual System

Keep the existing Privé palette but reduce the warm cream dominance so the interface reads as a refined operations tool, not a decorative landing page.

- Ink: `#171512`
- Ledger paper: `#f7f2e8`
- Champagne rule: `#b58b43`
- Mulberry mark: `#6e3c61`
- Sage balance: `#51665b`
- Steel text: `#625d55`

Typography:

- Use Fraunces sparingly for the Privé wordmark and major page titles.
- Use Manrope for navigation, form controls, buttons, and body text.
- Use IBM Plex Mono for numeric counts, currency, dates, and compact status values.

Signature element:

- Introduce a restrained ledger rule bar under the top tabs. It marks the active section and carries compact operational metadata that already exists in the shell, starting with the unassigned documents count.

## Layout Behavior

Desktop:

- Remove the persistent left navbar from the authenticated shell.
- Keep all primary routes visible as horizontal tabs when there is enough room.
- Preserve clear active states for exact and nested routes.
- Keep the unassigned documents badge on Legal entities.
- Keep Settings reachable as a primary tab or right-side utility link; it must not disappear into only the user menu.

Tablet and mobile:

- Collapse global navigation into a drawer before labels become cramped.
- Keep controls reachable with one tap from the header.
- Let page actions wrap below titles instead of shrinking text or causing overflow.
- Filter-heavy rows must wrap into a readable stacked layout.

## Page Surface Refactor

Update shared primitives instead of restyling every page independently:

- `PageHeader` actions wrap to a full-width row below the title on small screens and remain right-aligned on desktop.
- `Section` uses a flatter framed surface with smaller radius, lighter shadow, and clear dividers for tables and grouped tools.
- Table and filter surfaces use stable gaps, predictable wrapping, and horizontal overflow handling where table columns cannot fit.

Apply focused page cleanup to these pages:

- Dashboard: keep monthly controls compact and ensure metric cards are readable on mobile.
- Customers: improve the search/count/table area so it feels like a single work surface.
- Cash: make the multi-filter row wrap predictably on mobile.
- Hair orders and related list pages: align pagination and actions with the shared surface treatment.
- Legal entities: preserve local entity tabs and make them visually compatible with the global top-tabs shell.

## Data and Routing

No API, database, authentication, or route behavior changes are required.

Navigation should continue to use TanStack Router `Link`, current path active matching, and existing query loading behavior. Existing legal entity navigation helpers should remain the source of truth for legal entity section paths.

## Accessibility

- Preserve keyboard focus visibility.
- Use semantic links for navigation.
- Keep mobile drawer dismissible by navigation selection and standard Mantine drawer behavior.
- Ensure active navigation state is visually clear and represented in attributes/classes.
- Header controls must have accessible labels.

## Testing and Verification

Run the Vite+ project checks after implementation:

- `vp check`
- `vp test`

Also run or inspect the web app locally and verify at least:

- Desktop navigation active states.
- Mobile drawer navigation.
- Dashboard month controls.
- Customers search and pagination.
- Cash filter wrapping.
- Legal entity local tabs and unassigned document badge.

## Non-Goals

- Do not redesign authentication flows unless needed for shell consistency.
- Do not add a command palette in this pass.
- Do not change backend data models or API contracts.
- Do not replace Mantine or the existing theme system.
