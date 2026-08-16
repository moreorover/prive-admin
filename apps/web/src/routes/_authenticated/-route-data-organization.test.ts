import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
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

  it.each(routePageFiles(routesDir))("keeps dialog option prefetches out of route loaders %s", (path) => {
    const source = readFileSync(path, "utf8")

    expect(source).not.toMatch(
      /queryClient\.prefetchQuery\((appointment(Customer|Master|Salon)OptionsQueryOptions|availableHairOrdersListQueryOptions)/,
    )
  })

  it.each(routePageFiles(routesDir))("gates route-owned dialog option queries behind open state %s", (path) => {
    const source = readFileSync(path, "utf8")
    const routePath = relative(routesDir, path)
    const dialogOptionQueryPattern =
      /useQuery\(\{\s*\.\.\.(appointment(Customer|Master|Salon)OptionsQueryOptions|availableHairOrdersListQueryOptions)\(/g

    for (const match of source.matchAll(dialogOptionQueryPattern)) {
      const queryBlock = source.slice(match.index, source.indexOf("}).data", match.index) + 7)
      expect(`${routePath}\n${queryBlock}`).toMatch(/enabled:\s*\w+(Open|DialogOpen)/)
    }
  })
})
