import { describe, expect, it } from "vite-plus/test"

import { transactionFormSchema } from "./transaction-form-data"

describe("transaction form", () => {
  it("converts signed decimal amounts to minor units", () => {
    expect(
      transactionFormSchema.parse({ name: " Payment ", notes: " ", amountMajor: "12.34", currency: "EUR" }),
    ).toEqual({ name: "Payment", notes: null, amount: 1234, currency: "EUR" })
    expect(transactionFormSchema.parse({ name: "Payout", notes: "", amountMajor: "-5", currency: "GBP" })).toEqual({
      name: "Payout",
      notes: null,
      amount: -500,
      currency: "GBP",
    })
  })

  it("allows either sign while retaining the nonzero amount guard", () => {
    expect(transactionFormSchema.safeParse({ name: "", notes: "", amountMajor: -1, currency: "EUR" }).success).toBe(
      true,
    )
    expect(transactionFormSchema.safeParse({ name: "", notes: "", amountMajor: 0, currency: "EUR" }).success).toBe(
      false,
    )
  })
})
