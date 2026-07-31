import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

const routesDir = fileURLToPath(new URL("./", import.meta.url))

function routePageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      if (entry.startsWith("-")) return []
      return routePageFiles(path)
    }
    if (!path.endsWith(".tsx")) return []

    const basename = path.split("/").at(-1) ?? ""
    if (basename.startsWith("-")) return []
    return [path]
  })
}

describe("route data organization", () => {
  it.each(routePageFiles(routesDir))("keeps mutation orchestration outside %s", (path) => {
    const source = readFileSync(path, "utf8")
    expect(source).not.toContain("useMutation({")
    expect(source).not.toMatch(/const\s+\w*invalidate\w*\s*=/)
  })
})
