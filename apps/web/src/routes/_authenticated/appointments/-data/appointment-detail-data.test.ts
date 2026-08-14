import { readFileSync } from "node:fs"
import { describe, expect, it } from "vite-plus/test"

describe("appointment detail data", () => {
  it("prefetches unfiltered master options for the change master dialog", () => {
    const source = readFileSync(new URL("../$appointmentId.tsx", import.meta.url), "utf8")

    expect(source).toContain('appointmentMasterOptionsQueryOptions("")')
  })
})
