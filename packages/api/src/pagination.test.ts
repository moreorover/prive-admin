import { describe, expect, it } from "vite-plus/test"

import { getOffset, pageSchema, pagedResult, searchSchema } from "./pagination"

describe("pagination helpers", () => {
  it("defaults page and pageSize", () => {
    expect(pageSchema.parse({})).toEqual({ page: 1, pageSize: 10 })
  })

  it("rejects unsafe page sizes", () => {
    expect(() => pageSchema.parse({ page: 1, pageSize: 101 })).toThrow()
    expect(() => pageSchema.parse({ page: 0, pageSize: 25 })).toThrow()
  })

  it("trims blank search to undefined", () => {
    expect(searchSchema.parse("  alice  ")).toBe("alice")
    expect(searchSchema.parse("   ")).toBeUndefined()
    expect(searchSchema.parse(undefined)).toBeUndefined()
  })

  it("calculates offsets", () => {
    expect(getOffset({ page: 1, pageSize: 25 })).toBe(0)
    expect(getOffset({ page: 3, pageSize: 25 })).toBe(50)
  })

  it("returns the standard page envelope", () => {
    expect(pagedResult([{ id: "c1" }], { page: 2, pageSize: 10 }, 31)).toEqual({
      items: [{ id: "c1" }],
      page: 2,
      pageSize: 10,
      totalCount: 31,
    })
  })
})
