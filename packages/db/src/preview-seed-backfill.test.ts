import { readFileSync } from "node:fs"
import { URL } from "node:url"
import { describe, expect, it } from "vite-plus/test"

describe("preview database seeding", () => {
  it("reapplies data migrations after copying production data", () => {
    const script = readFileSync(new URL("../../../scripts/seed_preview_d1_database.sh", import.meta.url), "utf8")

    expect(script).toContain("0008_historical_personnel_backfill.sql")
    expect(script).toMatch(/wrangler d1 execute[\s\S]*0008_historical_personnel_backfill\.sql[\s\S]*--remote/)
  })
})
