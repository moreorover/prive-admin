import { describe, expect, it } from "vite-plus/test"

import { apiUrl } from "./server-url"

describe("server URL helpers", () => {
  it("builds REST API URLs from the configured server origin", () => {
    expect(apiUrl("/api/statement-attachments/upload", "https://server.example")).toBe(
      "https://server.example/api/statement-attachments/upload",
    )
  })
})
