import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

const routesDir = fileURLToPath(new URL("./", import.meta.url))

function routePageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return routePageFiles(path)
    if (!path.endsWith(".tsx")) return []

    const basename = path.split("/").at(-1) ?? ""
    if (basename.startsWith("-")) return []
    return [path]
  })
}

describe("route data organization", () => {
  it.each(routePageFiles(routesDir))("keeps mutation orchestration outside %s", (path) => {
    const source = readFileSync(path, "utf8")
    const routePath = relative(routesDir, path)

    expect(source, routePath).not.toContain("useMutation({")
    expect(source, routePath).not.toMatch(/const\s+\w*invalidate\w*\s*=/)
  })
})
