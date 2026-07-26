import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vite-plus/test"

const preCommitHook = resolve(import.meta.dirname, "../../../../.vite-hooks/pre-commit")

describe("React Doctor pre-commit hook", () => {
  it("runs from the web app so React rules are not gated off", () => {
    const hook = readFileSync(preCommitHook, "utf8")

    expect(hook).toMatch(/react-doctor@latest apps\/web --scope changed --blocking warning/)
    expect(hook).toContain("React rules were gated off")
    expect(hook).toContain("No React project detected")
  })
})
