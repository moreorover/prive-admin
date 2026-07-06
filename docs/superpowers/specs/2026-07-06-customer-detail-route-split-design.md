# Customer Detail Route Split Design

## Goal

Split the customer detail screen into route-scoped tabs so large customer histories are no longer truncated by the initial page load.

The new structure should:

- keep the customer shell lightweight
- load appointments, notes, and hair sales only when the matching tab route is active
- use URL state for tab selection, pagination, and search
- redirect `/customers/$customerId` to the appointments tab by default

## Current Problem

The existing customer detail route loads customer identity, summary, appointments, notes, and hair sales together. That creates two issues:

- the page becomes too large and difficult to maintain
- tab content is effectively limited by the first fetch, so customers with many appointments or notes only see the first slice of data

Notes are especially problematic because the current API returns a full list instead of a paged envelope, which makes it impossible to support URL-driven paging without changing the backend contract.

## Proposed Route Structure

Use nested TanStack Router file routes under `/customers/$customerId`:

- `/customers/$customerId/` or `/customers/$customerId` redirects to `/customers/$customerId/appointments`
- `/customers/$customerId/appointments`
- `/customers/$customerId/notes`
- `/customers/$customerId/hair-sales`

The parent customer route becomes a shell that loads only:

- `customers.get`
- `customers.summary`

Each child route owns its own loader, query params, and tab-specific UI.

## Route Responsibilities

### Parent shell route

The parent route should:

- render the shared customer header, summary cards, and navigation chrome
- provide a shared back link to the customer list
- not load appointments, notes, or hair sales data directly
- redirect the base customer URL to the appointments tab

The parent should remain stable across tab navigation so customer identity and summary data can be reused by children.

### Appointments tab route

The appointments child route should:

- load customer appointments with `page`, `pageSize`, and `search`
- render a paginated table
- keep the current page and search term in the URL
- reset to page `1` when the search term changes

This route can use the existing paged appointments API shape.

### Notes tab route

The notes child route should:

- load customer notes with `page`, `pageSize`, and `search`
- render a paginated list or table
- keep the current page and search term in the URL
- reset to page `1` when the search term changes

This requires changing the notes API to return the same paged envelope used by appointments, instead of a raw array.

### Hair sales tab route

The hair sales child route should:

- load customer hair assigned records with `page`, `pageSize`, and `search`
- render a paginated table
- keep the current page and search term in the URL

Hair sales can follow the same paging pattern as appointments for consistency.

## Data Flow

1. User opens `/customers/$customerId`.
2. The parent route loads customer identity and summary.
3. The base route redirects to `/customers/$customerId/appointments`.
4. The active tab route loads its own scoped list data.
5. Tab changes update the URL instead of local component state.
6. Pagination and search are controlled by query params such as `?page=2&search=trim`.

This makes each tab linkable, refresh-safe, and independently cacheable.

## Backend Changes

To support the route split, the API should expose paged customer note data.

Required changes:

- update `customers.notes.list` to accept `page`, `pageSize`, and optional `search`
- return `{ items, page, pageSize, totalCount }` from the notes list route
- keep the existing appointment and hair sales pagination contract aligned with the same envelope

The implementation should preserve existing invalidation behavior for create/update/delete mutations, but scope invalidations to the active resource instead of the whole customer detail page.

## UX Rules

- The active tab must be represented in the URL.
- Reloading the page should preserve the selected tab, page, and search.
- The customer shell must still show the shared summary regardless of which tab is open.
- The default customer URL should land on appointments, not on a blank overview.

## Error Handling

- If the customer cannot be loaded, the shell should show the existing not-found state.
- If a tab query fails, only that tab should show the failure state; the parent shell should remain visible.
- If pagination returns an empty page because the user is beyond the last page, the tab should clamp or reset to a valid page instead of rendering a broken empty state.

## Testing Plan

Add or update tests for:

- redirecting `/customers/$customerId` to `/customers/$customerId/appointments`
- parent route loading only customer and summary data
- appointments tab loading with `page` and `search`
- notes API returning a paged envelope
- notes tab pagination and URL search behavior
- hair sales tab pagination and URL search behavior
- cache invalidation after create/update/delete mutations

Manual verification should include:

- opening a customer with more than 25 appointments
- opening a customer with more than 25 notes
- switching between tabs and confirming the URL changes
- refreshing on each tab and confirming state is preserved

## Out of Scope

- redesigning the customer header or summary cards
- changing the underlying data model for appointments, notes, or hair sales
- adding new customer sub-features beyond the three tab routes

## Success Criteria

This change is complete when:

- the base customer URL redirects to appointments
- each tab loads only its scoped data
- notes are paged instead of truncated
- paging and search are shareable in the URL
- the customer shell remains fast and readable
