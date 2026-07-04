import { describe, expect, it } from "vite-plus/test"

import { clampPage, formatPageRange, withPinnedOption } from "./resource-pagination"

describe("resource pagination helpers", () => {
  it("formats the loaded item range for a paged resource", () => {
    expect(formatPageRange({ page: 1, pageSize: 25, itemCount: 25, totalCount: 75 })).toBe("showing 1-25 of 75")
    expect(formatPageRange({ page: 3, pageSize: 25, itemCount: 7, totalCount: 57 })).toBe("showing 51-57 of 57")
  })

  it("formats an empty resource range", () => {
    expect(formatPageRange({ page: 1, pageSize: 25, itemCount: 0, totalCount: 0 })).toBe("showing 0 of 0")
  })

  it("clamps pages to the available total count", () => {
    expect(clampPage({ page: 4, pageSize: 25, totalCount: 51 })).toBe(3)
    expect(clampPage({ page: 0, pageSize: 25, totalCount: 0 })).toBe(1)
  })

  it("keeps an existing selected option when it is not in the searched page", () => {
    expect(
      withPinnedOption(
        [
          { value: "customer-1", label: "Alice" },
          { value: "customer-2", label: "Beth" },
        ],
        { value: "customer-3", label: "Cara" },
      ),
    ).toEqual([
      { value: "customer-3", label: "Cara" },
      { value: "customer-1", label: "Alice" },
      { value: "customer-2", label: "Beth" },
    ])
  })

  it("does not duplicate an option that is already in the searched page", () => {
    expect(
      withPinnedOption(
        [
          { value: "customer-1", label: "Alice" },
          { value: "customer-2", label: "Beth" },
        ],
        { value: "customer-2", label: "Beth" },
      ),
    ).toEqual([
      { value: "customer-1", label: "Alice" },
      { value: "customer-2", label: "Beth" },
    ])
  })
})
