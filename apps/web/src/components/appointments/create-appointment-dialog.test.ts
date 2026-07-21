import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

const componentsDir = fileURLToPath(new URL("../", import.meta.url))

function componentSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return componentSourceFiles(path)
    if (path.endsWith(".tsx") && !path.endsWith(".test.tsx")) return [path]
    return []
  })
}

describe("component data ownership", () => {
  it.each(componentSourceFiles(componentsDir))("does not fetch route data inside %s", (path) => {
    const source = readFileSync(path, "utf8")
    const componentPath = relative(componentsDir, path)

    expect(source, componentPath).not.toContain("useQuery(")
    expect(source, componentPath).not.toContain("fetch(")
  })
})
