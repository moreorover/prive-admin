import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
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
    expect(source).not.toContain("useQuery(")
    expect(source).not.toContain("useSuspenseQuery(")
    expect(source).not.toContain("useMutation(")
  })
})
