import { readFileSync } from "node:fs"
import { describe, expect, it } from "vite-plus/test"

describe("appointment detail data", () => {
  it("loads master options only while the change master dialog is open", () => {
    const source = readFileSync(new URL("../$appointmentId.tsx", import.meta.url), "utf8")

    expect(source).toMatch(
      /useQuery\(\{\s*\.\.\.appointmentMasterOptionsQueryOptions\(debouncedMasterSearch\),\s*enabled: changeMasterOpen,/,
    )
    expect(source).not.toContain('appointmentMasterOptionsQueryOptions("")')
  })
})
