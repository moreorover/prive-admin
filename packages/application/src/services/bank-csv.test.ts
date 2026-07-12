import { describe, expect, it } from "vite-plus/test"

import { parseBankCsv } from "./bank-csv"

describe("parseBankCsv", () => {
  it("skips Swedbank transfers between own accounts", () => {
    const csv = [
      '"Account No","","Date","Beneficiary","Details","Amount","Currency","D/K","Record ID","Code","Reference No","Doc. No","Code in payer IS","Client code","Originator","Beneficiary party",',
      '"LT307300010202470914","20","2026-07-10","SVETLANA SELVENĖ","Transfer between own accounts","714.00","EUR","D","2026071003145867","MK","","","",',
      '"LT307300010202470914","20","2026-07-10","VAITKIENĖ GRETA","plaukai","50.00","EUR","K","2026071003279127","MK","","","",',
    ].join("\n")

    const parsed = parseBankCsv(csv)

    expect(parsed.accountIban).toBe("LT307300010202470914")
    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0]?.externalRef).toBe("2026071003279127")
  })
})
