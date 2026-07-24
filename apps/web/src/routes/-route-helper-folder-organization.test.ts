import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

const routesDir = fileURLToPath(new URL("./", import.meta.url))
const allowedHelperDirectories = new Set(["-actions", "-components", "-data"])
const allowedFlatHelperFiles = new Set([
  "-route-component-organization.test.ts",
  "-route-helper-folder-organization.test.ts",
  "-react-doctor-hook.test.ts",
  "_authenticated/-route-data-organization.test.ts",
])

function flatHelperFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      if (entry.startsWith("-")) {
        expect(allowedHelperDirectories.has(entry), relative(routesDir, path)).toBe(true)
        return []
      }
      return flatHelperFiles(path)
    }

    if (!entry.startsWith("-")) return []
    if (!/\.(ts|tsx)$/.test(entry)) return []

    const routePath = relative(routesDir, path)
    if (allowedFlatHelperFiles.has(routePath)) return []
    return [routePath]
  })
}

function componentFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return componentFiles(path)
    if (!/\.(tsx)$/.test(entry)) return []
    if (!path.includes("/-components/")) return []
    return [path]
  })
}

describe("route helper folder organization", () => {
  it("keeps route-local helpers inside concern folders", () => {
    expect(flatHelperFiles(routesDir)).toEqual([])
  })

  it.each(componentFiles(routesDir))("keeps route-local component files focused %s", (path) => {
    const source = readFileSync(path, "utf8")
    const declarations = source.match(/function\s+[A-Z][A-Za-z0-9_]*|const\s+[A-Z][A-Za-z0-9_]*\s*=/g) ?? []

    expect(declarations.length, relative(routesDir, path)).toBeLessThanOrEqual(4)
  })

  it.each(componentFiles(routesDir))("keeps route-local components server-state free %s", (path) => {
    const source = readFileSync(path, "utf8")
    const routePath = relative(routesDir, path)

    expect(source, routePath).not.toContain("useQuery(")
    expect(source, routePath).not.toContain("useSuspenseQuery(")
    expect(source, routePath).not.toContain("useMutation(")
    expect(source, routePath).not.toMatch(/use[A-Z][A-Za-z0-9]*(Action|Actions)\(/)
  })
})
