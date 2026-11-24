# Historical Personnel Backfill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Drizzle migration that creates missing personnel profiles from historical appointment assignments.

**Architecture:** Keep the existing one-profile-per-customer `personnel` table. The migration inserts masters first, then assistants only for customers without a profile, so master assignments take precedence without changing the schema.

**Tech Stack:** SQLite/D1, Drizzle migrations, Vitest, Vite+.

**Spec:** `docs/superpowers/specs/2026-11-24-historical-personnel-backfill-design.md`

## Global Constraints

- Use the existing Drizzle migration directory and metadata conventions.
- Do not add Better Auth access or compensation behavior.
- Do not overwrite existing personnel profiles.
- Preserve the current unique personnel profile per customer constraint.
- Use master precedence when a customer appears in both historical role sources.

## Review Focus

- A customer assigned as both master and assistant must receive exactly one `master` profile.
- Duplicate historical appointments must not create duplicate personnel rows.
- Existing active or inactive personnel profiles must remain unchanged.
- Empty appointment assignment tables must migrate successfully.
- The migration must be included in the migration ledger and run through normal deployment migration handling.

---

### Task 1: Add the migration regression test

**Files:**
- Create or modify the focused database migration test under `packages/db/src/` following the existing Vitest/SQLite test conventions.
- Test fixture uses the existing appointment, appointment_personnel, customer, and personnel schema.

**Interfaces:**
- Consumes: the migration SQL file added in Task 2.
- Produces: a regression test proving the historical backfill behavior.

- [ ] **Step 1: Write the failing test**

  Seed customers and appointments covering a master, an assistant, a customer appearing in both roles, duplicate assignments, an existing profile, and an empty assignment case. Apply the migration and assert:

  - masters become `type = 'master'`;
  - assistants become `type = 'assistant'`;
  - dual-role customers have one preserved/created master profile;
  - duplicate assignments produce one row;
  - existing profiles are unchanged.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `vp test packages/db/src/<focused-migration-test>.test.ts`

  Expected: FAIL because the backfill migration does not yet exist or does not insert the expected rows.

### Task 2: Add the Drizzle data migration

**Files:**
- Create: `packages/db/src/migrations/0008_<generated-name>.sql`
- Modify: `packages/db/src/migrations/meta/_journal.json`
- Create: `packages/db/src/migrations/meta/0008_snapshot.json` if required by the repository’s migration-generation workflow.

**Interfaces:**
- Consumes: historical `appointment.master_id` and `appointment_personnel.personnel_id` values.
- Produces: one `personnel` row per previously unprofiled assigned customer.

- [ ] **Step 1: Add the migration SQL**

  Insert distinct master IDs into `personnel` with `type = 'master'`, then insert distinct assistant IDs with `type = 'assistant'` only when no personnel row exists. Use SQLite-generated text IDs and table defaults for timestamps; leave `salon_id` null because historical assignments may span salons.

- [ ] **Step 2: Register the migration through Drizzle metadata**

  Generate or update the migration metadata using the project’s `vp run db:generate` workflow, preserving all existing migration files and journal entries.

- [ ] **Step 3: Run the focused test and verify it passes**

  Run: `vp test packages/db/src/<focused-migration-test>.test.ts`

  Expected: PASS for all historical-role and preservation cases.

### Task 3: Verify the repository and migration integration

**Files:**
- No additional production files.

- [ ] **Step 1: Verify migration generation is clean**

  Run: `vp run db:generate` and confirm there is no unexpected schema diff beyond the intended migration metadata.

- [ ] **Step 2: Run all checks**

  Run: `vp check`, `vp run -r check-types`, and `vp test`.

  Expected: formatting/lint/type checks pass and the complete test suite passes.

- [ ] **Step 3: Review the final diff**

  Confirm the migration is data-only, does not overwrite existing personnel, and is included in the Drizzle journal.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/db/src/migrations packages/db/src/<focused-migration-test>.test.ts
  git commit -m "feat: backfill historical personnel profiles"
  ```
