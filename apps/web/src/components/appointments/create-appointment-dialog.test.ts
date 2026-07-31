import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
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
    expect(source).not.toContain("useQuery(")
    expect(source).not.toContain("fetch(")
  })

  it.each(componentSourceFiles(componentsDir))("does not mutate server data inside %s", (path) => {
    const source = readFileSync(path, "utf8")
    expect(source).not.toContain("useMutation(")
    expect(source).not.toContain("mutationOptions(")
    expect(source).not.toContain(".mutate(")
  })
})
