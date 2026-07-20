import { describe, expect, it } from "vite-plus/test"

import { appNavGroups, flatAppNavItems, getActiveAppNavItem } from "./app-navigation"

describe("app navigation", () => {
  it("keeps settings as a visible account navigation item", () => {
    expect(appNavGroups.find((group) => group.label === "Account")?.items.map((item) => item.to)).toContain("/settings")
  })

  it("marks nested routes by their parent navigation item", () => {
    expect(getActiveAppNavItem("/customers/123")?.to).toBe("/customers")
    expect(getActiveAppNavItem("/legal-entities/entity-1/documents")?.to).toBe("/legal-entities")
    expect(getActiveAppNavItem("/hair-orders/order-1")?.to).toBe("/hair-orders")
  })

  it("keeps the unassigned badge on legal entities", () => {
    expect(flatAppNavItems.find((item) => item.to === "/legal-entities")?.badgeKey).toBe("unassigned")
  })
})
