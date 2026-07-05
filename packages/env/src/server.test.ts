import { resolve } from "node:path"
import { afterEach, expect, test, vi } from "vite-plus/test"

const originalCwd = process.cwd()

afterEach(() => {
  process.chdir(originalCwd)
  vi.resetModules()
})

test("expands values from the server env file", async () => {
  process.chdir(resolve(originalCwd, "apps/server"))

  const { env } = await import("./server")

  expect(env.DATABASE_URL).toBe("postgresql://postgres:password@localhost:5432/prive_admin")
})
