import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

const routeFiles = [
  "appointments/$appointmentId.tsx",
  "customers/$customerId/hair-sales.tsx",
  "hair-orders/$hairOrderId.tsx",
] as const

describe("route data organization", () => {
  it.each(routeFiles)("keeps repeated hair assignment action orchestration outside %s", (routeFile) => {
    const path = fileURLToPath(new URL(routeFile, import.meta.url))
    const source = readFileSync(path, "utf8")

    expect(source).not.toContain("invalidateHairAssignmentQueries")
  })
})
