import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

const componentsDir = fileURLToPath(new URL("./", import.meta.url))

function componentFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return componentFiles(path)
    if (!/\.(ts|tsx)$/.test(entry)) return []
    if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) return []
    return [path]
  })
}

describe("shared component server-state ownership", () => {
  it.each(componentFiles(componentsDir))("keeps server reads and writes out of %s", (path) => {
    const source = readFileSync(path, "utf8")
    const componentPath = relative(componentsDir, path)

    expect(source, componentPath).not.toContain("useQuery(")
    expect(source, componentPath).not.toContain("useSuspenseQuery(")
    expect(source, componentPath).not.toContain("useMutation(")
  })
})
