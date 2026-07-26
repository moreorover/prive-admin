import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

const routesDir = fileURLToPath(new URL("./", import.meta.url))

function publicRouteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      if (entry.startsWith("-")) return []
      return publicRouteFiles(path)
    }
    if (!path.endsWith(".tsx")) return []

    const basename = path.split("/").at(-1) ?? ""
    if (basename.startsWith("-")) return []
    return [path]
  })
}

describe("route component organization", () => {
  it.each(publicRouteFiles(routesDir))("keeps custom components outside route file %s", (path) => {
    const source = readFileSync(path, "utf8")
    const routePath = relative(routesDir, path)

    expect(source, routePath).not.toMatch(/function\s+(?!Route\b|RouteComponent\b)[A-Z][A-Za-z0-9_]*/)
    expect(source, routePath).not.toMatch(/(?:const|let|var)\s+(?!Route\b|RouteComponent\b)[A-Z][A-Za-z0-9_]*\s*=/)
  })
})
