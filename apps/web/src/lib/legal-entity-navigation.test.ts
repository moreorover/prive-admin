import { describe, expect, it } from "vite-plus/test"

import { getLegalEntitySectionFromPath, getLegalEntitySectionPath } from "./legal-entity-navigation"

describe("legal entity navigation", () => {
  it("detects the active legal entity section from a pathname", () => {
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1")).toBe("overview")
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1/overview")).toBe("overview")
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1/documents")).toBe("documents")
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1/bank-accounts")).toBe("bank-accounts")
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1/bank-accounts/account-1")).toBe("bank-accounts")
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1/salons")).toBe("salons")
    expect(getLegalEntitySectionFromPath("/dashboard")).toBe("overview")
  })

  it("builds legal entity section paths", () => {
    expect(getLegalEntitySectionPath("entity-1", "overview")).toBe("/legal-entities/entity-1/overview")
    expect(getLegalEntitySectionPath("entity-1", "documents")).toBe("/legal-entities/entity-1/documents")
    expect(getLegalEntitySectionPath("entity-1", "bank-accounts")).toBe("/legal-entities/entity-1/bank-accounts")
    expect(getLegalEntitySectionPath("entity-1", "salons")).toBe("/legal-entities/entity-1/salons")
  })
})
