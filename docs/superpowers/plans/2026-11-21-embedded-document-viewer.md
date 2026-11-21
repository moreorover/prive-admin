# Embedded Document Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed an authenticated Mantine document viewer in the existing document-matching page so users can inspect a bank statement while choosing a candidate entry.

**Architecture:** Add the viewer as a route-local presentational component. The existing match route continues to own the attachment query and mutation; it passes document metadata and the authenticated preview URL into the viewer. The viewer owns only library configuration and rendering, with a responsive two-column/stacked layout supplied by the match page.

**Tech Stack:** React, Mantine, TanStack Router, TanStack Query, Vite+, `mantine-doc-viewer`, `pdfjs-dist`.

**Spec:** `docs/superpowers/specs/2026-11-21-embedded-document-viewer-design.md`

## Global Constraints

- Components must not initiate server reads or mutations; the existing route owner remains responsible for document data and matching mutations.
- Keep the current authenticated preview endpoint and use the existing `attachmentPreviewUrl` helper.
- Support PDF, images, and text/CSV where the viewer supports them; Office rendering is out of scope.
- Preserve download access and the existing matching, filtering, pagination, and assignment behavior.
- Use Vite+ commands for dependency installation and validation: `vp install`, `vp check`, and `vp test`.

## Review Focus

- Cross-origin development preview requests must retain session cookies; test the viewer configuration for credentialed API access.
- Preview URLs have no file extension; test that MIME type and original filename are passed explicitly.
- Attachments with unsupported or unknown types must show the viewer’s safe fallback/download state rather than breaking the match page.
- Large/multi-page PDFs must remain bounded inside the desktop viewer and expose fullscreen for more space.
- Narrow/mobile layouts must stack the viewer before candidate controls without hiding assignment actions.

### Task 1: Add viewer dependencies and application configuration

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/src/components/document-viewer.tsx`
- Test: `apps/web/src/components/document-viewer.test.tsx`

**Interfaces:**
- Produces `DocumentViewerProps` with `src`, `fileName`, and `mimeType` fields for the route-local viewer.
- Produces a `DocumentViewer` component that renders a Mantine `DocViewer` and does not query or mutate server state.

- [ ] **Step 1: Add the failing configuration tests**

  Add tests asserting that the viewer component accepts an extensionless authenticated preview URL, passes the document MIME type and filename to `DocViewer`, and renders a stable fallback wrapper for an unsupported content type. Mock the third-party viewer only where needed to inspect props.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `vp test apps/web/src/components/document-viewer.test.tsx`

  Expected: FAIL because the component and dependencies are not present.

- [ ] **Step 3: Add the dependencies and viewer styles**

  Add `mantine-doc-viewer` and `pdfjs-dist` to `apps/web/package.json`. Import `mantine-doc-viewer/styles.css` from the web stylesheet entry alongside the existing Mantine styles.

- [ ] **Step 4: Implement `DocumentViewer`**

  In `apps/web/src/components/document-viewer.tsx`, create the PDF.js adapter once at module scope using the Vite worker URL (`pdf.worker.min.mjs?url`). Render `DocViewerAdapterProvider` with the PDF adapter and `DocViewer` with `src`, `fileName`, `mimeType`, a fixed responsive height, `pageColorScheme="auto"`, and download/fullscreen controls. Configure the adapter for the authenticated API preview URL and disable range requests because the current endpoint does not promise range support.

- [ ] **Step 5: Install and run the focused test**

  Run: `vp install && vp test apps/web/src/components/document-viewer.test.tsx`

  Expected: PASS.

### Task 2: Embed the viewer into the matching page

**Files:**
- Modify: `apps/web/src/routes/_authenticated/documents/$documentId/match.tsx`
- Modify: `apps/web/src/routes/_authenticated/documents/$documentId/-components/match-page.tsx`
- Modify: `apps/web/src/components/attachment-preview.ts`
- Test: `apps/web/src/components/attachment-preview.test.ts`

**Interfaces:**
- Consumes `DocumentViewerProps` from Task 1.
- Keeps `DocumentMatchPage` callback and query props unchanged except for replacing the old preview action with the embedded viewer data.

- [ ] **Step 1: Extend the attachment preview contract test**

  Add an assertion that `attachmentPreviewUrl` remains the single source for the preview URL and that it can be passed unchanged to an embedded viewer, including IDs requiring URL encoding.

- [ ] **Step 2: Run the focused existing tests**

  Run: `vp test apps/web/src/components/attachment-preview.test.ts`

  Expected: PASS before the page integration changes.

- [ ] **Step 3: Replace the preview link with the embedded viewer**

  In `DocumentMatchPage`, render `DocumentViewer` in the left desktop column using the loaded document’s preview URL, original filename, and content type. Remove the separate “Preview document” anchor. Keep the document metadata and already-matched message adjacent to the viewer.

- [ ] **Step 4: Preserve the candidate workflow and responsive layout**

  Keep candidate filters/cards and their handlers in the right column. Use the existing Mantine grid breakpoints so desktop shows viewer plus candidates and narrow screens stack viewer first. Keep assignment disabled when the document is already matched.

- [ ] **Step 5: Run focused route/component tests**

  Run: `vp test apps/web/src/components/attachment-preview.test.ts apps/web/src/components/document-viewer.test.tsx`

  Expected: PASS.

### Task 3: Verify the integration and refine layout

**Files:**
- Modify: `apps/web/src/routes/_authenticated/documents/$documentId/-components/match-page.tsx` (only if verification reveals layout issues)
- Modify: `packages/ui/src/styles/globals.css` (only if viewer styling needs an app-level compatibility rule)

- [ ] **Step 1: Run formatting, lint, type checking, and tests**

  Run: `vp check && vp test`

  Expected: formatting/lint completes successfully and all tests pass.

- [ ] **Step 2: Run the web build**

  Run: `vp run --filter web build`

  Expected: the production build succeeds, including the PDF.js worker URL import.

- [ ] **Step 3: Manually verify the match page**

  Run: `vp run dev:web` with the existing server available, open a real authenticated document match page, and verify: PDF rendering, page navigation/search/zoom, download, fullscreen, candidate matching, and stacked mobile layout.

- [ ] **Step 4: Review the final diff**

  Run: `git diff --check && git status --short`

  Expected: no whitespace errors; only the approved design/plan and viewer integration files are changed.

- [ ] **Step 5: Commit the implementation**

  ```bash
  git add apps/web/package.json apps/web/src/index.css apps/web/src/components/document-viewer.tsx apps/web/src/components/document-viewer.test.tsx apps/web/src/components/attachment-preview.ts apps/web/src/components/attachment-preview.test.ts apps/web/src/routes/_authenticated/documents/$documentId/match.tsx apps/web/src/routes/_authenticated/documents/$documentId/-components/match-page.tsx packages/ui/src/styles/globals.css
  git commit -m "feat: embed document viewer in matching flow"
  ```

## Self-review

- Spec coverage: the selected embedded approach, supported formats, authenticated preview, responsive layout, preserved matching flow, and non-goals are covered by Tasks 1–3.
- Type consistency: Task 1 exports the exact `DocumentViewerProps` consumed by Task 2; route-owned data remains unchanged.
- Review focus: each listed failure mode has a focused test or an explicit build/manual verification step.
- Proportion: the plan limits changes to dependency/style setup, one reusable viewer wrapper, and the existing match page.
