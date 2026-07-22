import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

const srcDir = fileURLToPath(new URL("./", import.meta.url))
const forbiddenImports = [
  "@/",
  "@tanstack/react-query",
  "@tanstack/react-router",
  "@trpc/",
  "@prive-admin-tanstack/api",
  "@prive-admin-tanstack/db",
] as const
const forbiddenSourcePatterns = ["useQuery(", "useMutation(", "mutationOptions(", ".mutate(", "fetch("] as const

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    if ((path.endsWith(".ts") || path.endsWith(".tsx")) && !path.endsWith(".test.ts")) return [path]
    return []
  })
}

describe("ui package boundary", () => {
  it.each(sourceFiles(srcDir))("does not import app or server data dependencies from %s", (path) => {
    const source = readFileSync(path, "utf8")
    const packagePath = relative(srcDir, path)

    for (const forbiddenImport of forbiddenImports) {
      expect(source, packagePath).not.toContain(`from "${forbiddenImport}`)
    }

    for (const forbiddenPattern of forbiddenSourcePatterns) {
      expect(source, packagePath).not.toContain(forbiddenPattern)
    }
  })
})
