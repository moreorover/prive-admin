# Legal Entities UI Access Design

## Context

The legal entities area currently has a plain list at `/legal-entities` and entity-specific navigation that appears in the global sidebar only after an entity is selected. This makes several common paths feel hidden:

- Finding a specific legal entity.
- Discovering entity subpages: Overview, Documents, Bank accounts, and Salons.
- Moving from one legal entity to another.
- Finding where document upload and assignment work happens.

The route serves both frequent operators, such as admins and bookkeepers, and occasional users, such as owners or managers. The expected legal entity count is small, usually one to five entities, so the design should favor direct access and clarity over heavy filtering.

## Goals

- Make `/legal-entities` a clear hub for all legal entities and their primary actions.
- Make entity subpage access visible inside each legal entity page without requiring the global sidebar.
- Allow switching between legal entities while staying in the same task area when possible.
- Surface pending document work at decision points.
- Keep the implementation aligned with existing Mantine and TanStack Router patterns.

## Non-Goals

- Add legal entity creation unless an existing flow already supports it.
- Add heavy search, filtering, or sorting for large legal entity sets.
- Redesign unrelated workspace navigation.
- Change backend document scoping unless existing APIs already support it.

## User Experience

### Legal Entities Hub

`/legal-entities` should become a compact hub rather than a plain table. Each entity should be shown as a scannable card or enhanced row with:

- Entity name as the primary entry point.
- Type, country, and default currency as secondary identity details.
- Direct actions for Overview, Documents, Bank accounts, and Salons.
- A pending document badge on the Documents action when there are unassigned documents.

Because the expected entity count is small, all entities should be visible without requiring search. The layout should remain compact on desktop and readable on mobile, with direct actions still reachable without opening the global sidebar.

### Entity Detail Navigation

`/legal-entities/$legalEntityId` should own local navigation for entity-level tasks:

- Add a subtle `Back to legal entities` link above the page header.
- Keep the existing page header with legal entity name, type, country, and currency.
- Add local tabs below the header for Overview, Documents, Bank accounts, and Salons.
- Add a pending document badge to the Documents tab when unassigned documents exist.
- Keep the existing Edit action.
- Add an entity switcher in the header actions.

The local tabs should follow the customer detail route precedent, where users can move between related subpages from the page itself. After this is added, the legal-entity subnav in the global sidebar should be removed or de-emphasized. The sidebar should keep `Legal entities` as the global entry point, with its existing pending document badge if still useful.

### Entity Switching

The entity switcher should list the small set of legal entities by name. When the user selects another legal entity, navigation should preserve the current section when possible:

- From Overview to the selected entity's Overview.
- From Documents to the selected entity's Documents.
- From Bank accounts to the selected entity's Bank accounts.
- From Salons to the selected entity's Salons.

If the current path cannot map cleanly, fall back to the selected entity's Overview.

### Document Access

The current documents page works with unassigned documents globally. The UI should preserve this behavior unless backend support for entity-specific document scoping already exists.

To avoid misleading users, document labels should continue to say `Unassigned documents` where appropriate. Pending document counts should appear at access points, but should not imply the pending files belong only to the selected legal entity.

## Components And Data

### Routes

- `apps/web/src/routes/_authenticated/legal-entities/index.tsx`
  - Render the entity hub.
  - Query `trpc.legalEntities.list`.
  - Query `trpc.bankStatementAttachments.list({ assigned: false })` for the pending document count.

- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/route.tsx`
  - Render the back link, page header, edit modal, entity switcher, local tabs, and outlet.
  - Query `trpc.legalEntities.get` for the current entity.
  - Query `trpc.legalEntities.list` for the entity switcher.
  - Query `trpc.bankStatementAttachments.list({ assigned: false })` for the Documents tab badge.

- `apps/web/src/routes/_authenticated/route.tsx`
  - Keep `Legal entities` as a global navigation item.
  - Remove or reduce the nested legal entity sidebar subnav once local tabs exist.

### Shared Helpers

If the hub and detail layout duplicate action or tab metadata, introduce a small local helper near the legal-entity routes. The helper should define tab labels, icons, path values, and badge behavior. Avoid broader abstractions unless duplication becomes meaningful.

## Edge Cases

- No legal entities: show a clear empty state on the hub. Do not add creation unless an existing route or mutation already supports it.
- Missing legal entity: show a concise not-found state with a link back to `/legal-entities`.
- Loading state: keep labels stable and avoid layout shifts where possible.
- Mobile: local tabs and hub actions must remain reachable without relying on the collapsed sidebar.

## Acceptance Criteria

- A user can land on `/legal-entities` and immediately see each entity plus direct paths to Overview, Documents, Bank accounts, and Salons.
- A user inside an entity can switch subpages without opening the global sidebar.
- A user inside an entity can switch to another legal entity and stay on the equivalent subpage when possible.
- Pending unassigned document work is visible on the hub and detail Documents tab.
- Mobile access to legal entity subpages does not depend on opening the sidebar.
- The global sidebar remains a stable entry point to legal entities without being the only place entity subpages are discoverable.

## Verification

- Run `vp check`.
- Run `vp test`.
- If responsive layout changes are implemented, run the web app locally and inspect desktop and mobile behavior.

The current baseline `vp test` fails before this design work when required environment variables for `packages/env/src/server.test.ts` are missing. That should be treated as an environment setup issue unless it persists with the expected env file or variables present.
