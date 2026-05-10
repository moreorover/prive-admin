# Information architecture redesign — entity-first navigation

Date: 2026-05-10
Status: Approved (design)
Branch: feat/multi-legal-entity

## Goal

The current top-level navigation flattens cross-cutting concerns
(`Dashboard`, `Bank statements`, `Reports`, `Salons`, `Hair Orders`,
`Legal entities`) into separate tabs even though all of them belong to a
specific legal entity. The user always works entity-first: pick the
entity, then look at its statements / reports / salons. Cross-entity
roll-ups are not needed.

This spec restructures the IA so that legal entities become the primary
container, and entity-scoped concerns live as tabs inside the entity
detail page. The result is fewer top-level tabs, fewer redundant
filter controls, and URLs that match the user's mental model.

## Final IA

### Topbar (4 tabs)

- Customers (global, shared customer pool)
- Calendar (global)
- Hair Orders (global, with legal-entity filter — kept for cross-entity scan)
- Legal entities (entry point for everything entity-scoped)

### Inside legal entity detail (5 tabs)

- Overview — entity-scoped KPIs (replaces global Dashboard)
- Bank accounts — list of entity's accounts; click drills to bank
  account detail page where statements live
- Reports — monthly bank account + cash breakdown for this entity
- Hair orders — entity-filtered view, reuses global hair-orders components
- Salons — entity's salons list

Entity edit stays as a modal (no Settings tab).

## Route tree

```
/_authenticated
├── customers/                       (unchanged)
├── calendar.tsx                     (unchanged)
├── hair-orders/                     (unchanged, global with LE filter)
├── appointments/
│   ├── route.tsx                    (Outlet, kept)
│   └── $appointmentId.tsx           (deep-link only; back link → /calendar)
├── bank-accounts/
│   └── $bankAccountId.tsx           (kept; statements live here)
├── legal-entities/
│   ├── route.tsx                    (Outlet wrapper)
│   ├── index.tsx                    (LE list, unchanged)
│   └── $legalEntityId/              (NEW layout dir)
│       ├── route.tsx                (NEW: layout — title + tabs strip + <Outlet/>)
│       ├── index.tsx                (NEW: redirect to ./overview)
│       ├── overview.tsx             (NEW: KPIs, entity-scoped)
│       ├── bank-accounts.tsx        (NEW)
│       ├── reports.tsx              (NEW)
│       ├── hair-orders.tsx          (NEW)
│       └── salons.tsx               (NEW)
└── profile.tsx, settings.tsx        (unchanged)

DELETED:
├── dashboard.tsx
├── bank-statements/                 (folded — statements live under bank-accounts/$id)
├── reports/                         (folded into entity)
├── salons/                          (folded into entity)
└── files.tsx, files-direct.tsx      (orphaned, hidden from nav already; drop)
```

The tab strip inside the LE layout route uses Mantine `Tabs` matching
the topbar pattern, with active value driven by `useLocation().pathname`.

## Component moves

| Source | Target | Change |
|--|--|--|
| `dashboard.tsx` body | `legal-entities/$id/overview.tsx` | Strip cross-entity filter; scope by `params.legalEntityId`. Reuse `getDashboardData({ legalEntityId })`. |
| `bank-statements/index.tsx` (CSV import + entries table + unassigned-docs card) | `bank-accounts/$bankAccountId.tsx` (extend existing) | Move CSV import + entries table into account detail (bank-account filter is now URL-driven, drop the dropdown). Unassigned-docs card moves to entity Overview tab (cross-account inside entity). `LinkToAppointmentModal` and `PromoteStandaloneModal` co-locate with the entries table. |
| `reports/index.tsx` body | `legal-entities/$id/reports.tsx` | Pass `legalEntityId` to monthly-breakdown server fns. |
| Bank accounts card from `legal-entities/$legalEntityId.tsx` | `legal-entities/$id/bank-accounts.tsx` | Extract; old page becomes layout route. |
| `salons/` page body | `legal-entities/$id/salons.tsx` | Filter salons by entity. Cross-entity salons list dropped. |
| `hair-orders/` (global page) | Stays at `/hair-orders` global | Extract `HairOrdersTable` so `legal-entities/$id/hair-orders.tsx` reuses it with entity pre-filter. |
| `legal-entities/$legalEntityId.tsx` | Becomes `legal-entities/$legalEntityId/route.tsx` (layout) + `index.tsx` (redirect to `./overview`) | Edit modal + entity name title + tab strip live in layout. |

### New shared components

- `src/components/legal-entity-tabs.tsx` — Mantine Tabs for in-entity nav.

## Data flow

Entity-scoped pages all read `legalEntityId` from route params:

```ts
const { legalEntityId } = Route.useParams()
```

Server functions gain optional `legalEntityId`; bodies add a where
clause when present:

| Server fn | Change |
|--|--|
| `getDashboardData` | already accepts `legalEntityId?` — no change |
| `getBankAccountMonthlyBreakdown` | add `legalEntityId?: string`; filter via `bankAccount.legalEntityId` join |
| `getCashMonthlyBreakdown` | add `legalEntityId?: string`; filter `transaction.legalEntityId` directly |
| `listSalons` | ensure accepts `legalEntityId?` |
| `getHairOrders` | already supports LE filter — no change |
| `listBankAccounts` | already supports LE filter — no change |

Query keys must include `legalEntityId` so React Query caches per entity:

```ts
queryKey: ["reports", "bank", year, legalEntityId]
```

### Cross-cutting concerns

- Bank account detail page (`/bank-accounts/$bankAccountId`) gets a
  "Back to {entity name}" anchor → `/legal-entities/$leId/bank-accounts`.
  The account record already has `legalEntityId` FK.
- Promote-to-appointment modal inside statements stays unchanged.
- Unassigned bank-statement attachments (`bankStatementEntryId IS NULL`)
  are entity-agnostic. The unassigned-docs card on each entity Overview
  shows the same global list — uploading on Privé UK and uploading on
  Privé LT IV both hit the same pool. No `legalEntityId` column is added
  to `bank_statement_attachment`. Once a doc is assigned to an entry,
  the entry's bank account's entity scopes it implicitly.

## Migration & redirects

| Old | New |
|--|--|
| `/dashboard` | redirect to `/legal-entities` |
| `/bank-statements` | redirect to `/legal-entities` |
| `/reports` | redirect to `/legal-entities` |
| `/salons`, `/salons/$id` | redirect to `/legal-entities` |
| `/bank-accounts/$id` | unchanged (deep-linkable) |
| `/appointments` | already removed |
| `/files`, `/files-direct` | delete (orphaned, already hidden from nav) |

Redirects use TanStack Router `redirect` in `beforeLoad`. Each old
route becomes a thin stub that 302s.

### Order of work (suggested commits)

1. Server-fn argument additions (`legalEntityId?` on reports
   breakdowns). Backwards compatible — existing callers still work.
2. Extract shared components: `HairOrdersTable`, `BankStatementsTable`,
   dashboard KPI cards.
3. Build new entity layout route + tab strip + `index.tsx` redirect.
4. Add entity tabs one at a time:
   overview → bank-accounts → reports → hair-orders → salons. Each tab
   merges with the corresponding old global page's logic.
5. Move CSV import + entries table into `bank-accounts/$bankAccountId.tsx`.
6. Update topbar tabs array (drop 4, keep 4).
7. Replace old pages with redirect stubs.
8. Delete `files.tsx`, `files-direct.tsx`; remove unused generic
   upload code if no remaining callers.

### Risks

- External bookmarks to `/bank-statements` etc. land on
  `/legal-entities`. User has to pick entity. Acceptable since the app
  has 2 users.
- `routeTree.gen.ts` churn — large diff but auto-regenerated.
- Server-fn signatures change — TypeScript flags missing call-sites at
  compile time; typecheck after every commit step.

## Testing

Project has no integration test setup in `apps/web` (vitest is
configured in `packages/db` only). Approach is pragmatic.

### Mechanical checks (run after every commit step)

- `bun run check-types`
- `bun run check` (oxlint + oxfmt)
- `bun run db:generate` (confirm no unintended schema drift; this
  redesign has no schema changes)

### Manual smoke test (once, at end)

- Visit each entity → all 5 tabs render without error
- Bank accounts tab → click account → CSV import works → entry appears
- Reports tab → year picker; numbers match before/after migration
- Hair orders tab → entity filter applied, data correct
- Old URLs (`/dashboard`, `/reports`, `/bank-statements`, `/salons`)
  302 to `/legal-entities`
- Topbar shows 4 tabs only

### Rollback plan

Each step is its own commit. If a tab feels wrong, revert that commit.
Old page files become redirect stubs in step 7 only — until then, new
and old routes coexist.

## Out of scope

- Schema changes. None required.
- Customers page rework. Stays global.
- Calendar redesign. Stays global.
- Permissions / multi-user role changes. Not relevant for 2-user app.
- Mobile-specific layout. Mantine drawer pattern is reused as-is.
