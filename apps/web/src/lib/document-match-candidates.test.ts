import { describe, expect, it } from "vite-plus/test"

import {
  filterDocumentMatchCandidates,
  formatCandidateAmount,
  getDocumentMatchFilterOptions,
  type DocumentMatchCandidate,
} from "./document-match-candidates"

const candidates: DocumentMatchCandidate[] = [
  {
    id: "entry-1",
    date: "2026-07-10",
    amount: 5000,
    currency: "EUR",
    direction: "C",
    counterpartyName: "Vaitkiene Greta",
    status: "PENDING",
    bankAccount: {
      id: "account-1",
      displayName: "LT307300010202470914",
      bankName: "Swedbank",
      legalEntity: { id: "entity-1", name: "Prive LT IV" },
    },
  },
  {
    id: "entry-2",
    date: "2026-07-09",
    amount: 37_000,
    currency: "EUR",
    direction: "C",
    counterpartyName: "Remigija Simonaite",
    status: "PENDING",
    bankAccount: {
      id: "account-2",
      displayName: "LT577044090116053605",
      bankName: "SEB Bankas",
      legalEntity: { id: "entity-2", name: "Prive LT MB" },
    },
  },
]

describe("document match candidates", () => {
  it("filters candidates by separate fields", () => {
    expect(
      filterDocumentMatchCandidates(candidates, {
        legalEntityId: "entity-2",
        bankAccountId: "account-2",
        counterparty: "remigija",
        date: "2026-07-09",
        amount: "370",
      }).map((candidate) => candidate.id),
    ).toEqual(["entry-2"])
  })

  it("derives bank account options from the selected legal entity", () => {
    expect(getDocumentMatchFilterOptions(candidates, "entity-1")).toEqual({
      legalEntities: [
        { value: "entity-1", label: "Prive LT IV" },
        { value: "entity-2", label: "Prive LT MB" },
      ],
      bankAccounts: [{ value: "account-1", label: "LT307300010202470914 · Swedbank" }],
    })
  })

  it("formats debit candidate amounts with one direction sign", () => {
    expect(formatCandidateAmount({ amount: -170, currency: "EUR", direction: "D" })).toBe("-€1.70")
  })
})
