# Embedded document viewer design

## Intent

Make uploaded bank-statement documents inspectable directly from the existing
“Match document” workflow. The viewer should keep the document and candidate
bank entries visible together, reducing context switching while matching.

## Goals

- Replace the current “Preview document” new-tab link with an embedded viewer.
- Support the attachment formats the viewer handles well: PDF, images, and
  plain text/CSV where applicable.
- Preserve the existing matching, filtering, pagination, and assignment flow.
- Keep the viewer usable on small screens by stacking it above the candidates.
- Preserve authenticated access to the private preview endpoint.

## Non-goals

- Office document rendering; `mantine-doc-viewer` does not support it.
- PDF annotation, page editing, or persistence of viewer state.
- Changes to upload, storage, or attachment APIs unless required for viewer
  authentication or content detection.

## Approaches

1. **Embedded viewer on the match page — selected.** The document preview
   occupies the left column on desktop, with matching controls on the right;
   the layout stacks on mobile. This best serves the current matching task.
2. **Dedicated viewer route.** This gives the document more room and makes a
   reusable reading surface, but forces users to switch between viewing and
   matching. It is better suited to a future document workspace.

## Implementation direction

- Add `mantine-doc-viewer` and its PDF adapter dependencies to `apps/web`.
- Register the viewer styles and a PDF.js adapter once at the app boundary.
- Create a route-owned viewer wrapper that receives the document metadata and
  preview URL as props; it will not initiate its own server query.
- Pass the attachment MIME type and filename explicitly because the preview
  URL has no file extension.
- Configure PDF.js for the authenticated API URL, including credentials and
  disabling range requests if the current preview response does not support
  them.
- Keep download available, but remove the separate preview anchor.
- Add focused tests for viewer configuration/format handling and run the
  project checks and tests.

## Success criteria

On the match page, a user can read and navigate the uploaded document while
reviewing candidate entries, assign a candidate without leaving the page, and
use the layout comfortably on desktop and mobile.
