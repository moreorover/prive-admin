# Task 3 Report: Assigned Documents Query

## Status

Implemented and committed the TRPC assigned bank-statement documents query.

## Changes

- Added `listAssignedBankStatementAttachments` to the router service imports.
- Added the shared `pageSchema`, `getOffset`, and `pagedResult` pagination helpers.
- Added `bankStatementAttachmentsRouter.listAssigned`, accepting `legalEntityId`, `page`, and `pageSize`.
- Forwarded `{ legalEntityId, pageSize, offset }` to the application service and returned the standard paged envelope.
- Added a focused router test covering the page envelope and service arguments.

## Validation

- `vp test packages/api/src/routers/bank-statement-attachments.test.ts`: passed, 1 test.
- `vp check`: passed formatting and lint checks.
- `vp run --filter web check-types`: passed.
- `vp test`: failed during full-suite discovery with 23 failed suites and 52 passing tests. The failures include tests discovered from sibling `.worktrees` and built `packages/*/dist` output; representative errors are missing `@/errors` resolution, missing copied migration files, and undefined environment configuration. This is the known workspace discovery failure and is unrelated to the focused router test.

## Commit

`feat: expose assigned document query`

## Concerns

The repository-wide test command continues to discover sibling worktrees and generated `dist` tests. Until test discovery is constrained to the active workspace/source files, `vp test` cannot provide a clean full-suite result.
