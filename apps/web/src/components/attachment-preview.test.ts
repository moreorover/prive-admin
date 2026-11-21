import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vite-plus/test"

import type { DocumentViewerProps } from "./document-viewer"

import { attachmentPreviewUrl, embeddedAttachmentPreviewUrl } from "./attachment-preview"

describe("attachment preview", () => {
  it("builds the authenticated attachment preview URL", () => {
    expect(attachmentPreviewUrl({ id: "attachment 1" })).toBe("/api/statement-attachments/preview?id=attachment%201")
  })

  it("accepts the canonical preview URL as the embedded viewer source", () => {
    const id = "attachment / 2026?ref=ä&copy#1"
    const viewerProps: DocumentViewerProps = {
      src: attachmentPreviewUrl({ id }),
      fileName: "statement.pdf",
      mimeType: "application/pdf",
    }

    expect(viewerProps.src).toBe(
      "/api/statement-attachments/preview?id=attachment%20%2F%202026%3Fref%3D%C3%A4%26copy%231",
    )

    const embedded = new URL(embeddedAttachmentPreviewUrl(viewerProps.src) ?? "", "https://web.example.org")
    expect(Object.fromEntries(embedded.searchParams)).toEqual({ id, download: "1" })
  })

  it("passes the match route's attachment preview URL directly into the embedded viewer", () => {
    const routeDir = new URL("../routes/_authenticated/documents/$documentId/", import.meta.url)
    const route = readFileSync(new URL("match.tsx", routeDir), "utf8")
    const page = readFileSync(new URL("-components/match-page.tsx", routeDir), "utf8")

    expect(route).toContain("src: attachmentPreviewUrl(document)")
    expect(route).toContain("documentViewerProps={documentViewerProps}")
    expect(page).toContain("<DocumentViewer {...documentViewerProps} />")
    expect(page).not.toContain("attachmentPreviewUrl")
    expect(page).not.toContain("Preview document")
  })

  it("does not embed attachment previews in iframes", () => {
    const componentDir = new URL(".", import.meta.url)
    const attachmentSources = readdirSync(componentDir)
      .filter((file) => file.startsWith("attachment-preview") && file.endsWith(".tsx"))
      .map((file) => readFileSync(join(componentDir.pathname, file), "utf8"))

    expect(attachmentSources.join("\n")).not.toContain("<iframe")
  })
})
