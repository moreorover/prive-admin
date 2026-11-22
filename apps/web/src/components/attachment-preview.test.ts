import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vite-plus/test"

import { attachmentPreviewUrl } from "./attachment-preview"

describe("attachment preview", () => {
  it("builds the authenticated attachment preview URL", () => {
    expect(attachmentPreviewUrl({ id: "attachment 1" })).toBe("/api/statement-attachments/preview?id=attachment%201")
  })

  it("does not embed attachment previews in iframes", () => {
    const componentDir = new URL(".", import.meta.url)
    const attachmentSources = readdirSync(componentDir)
      .filter((file) => file.startsWith("attachment-preview") && file.endsWith(".tsx"))
      .map((file) => readFileSync(join(componentDir.pathname, file), "utf8"))

    expect(attachmentSources.join("\n")).not.toContain("<iframe")
  })
})
