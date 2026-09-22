import { describe, expect, it } from "vite-plus/test"

import { parseBankCsv } from "./bank-csv"

describe("bank CSV parser", () => {
  it("detects localized Swedbank CSV exports by account header", () => {
    const csv = [
      '"Sąskaitos Nr.","","Data","Gavėjas","Paaiškinimai","Suma","Valiuta","D/K","Įrašo Nr.","Kodas","Įmokos kodas","Dok. Nr.","Kliento kodas mokėtojo IS","Kliento kodas","Pradinis mokėtojas","Galutinis gavėjas",',
      '"LT307300010202470914","20","2026-07-31","Jelena Pavliukovičienė","Plaukai","130.00","EUR","K","2026073102381611","MK","","","",',
    ].join("\n")

    const parsed = parseBankCsv(csv)

    expect(parsed).toEqual({
      accountIban: "LT307300010202470914",
      rows: [
        {
          docNumber: "",
          date: "2026-07-31",
          currency: "EUR",
          amount: 13000,
          counterpartyName: "Jelena Pavliukovičienė",
          counterpartyIban: null,
          counterpartyBank: null,
          swift: null,
          purpose: "Plaukai",
          externalRef: "2026073102381611",
          transactionType: "MK",
          direction: "C",
          accountAmount: 13000,
          accountIban: "LT307300010202470914",
          accountCurrency: "EUR",
        },
      ],
    })
  })
})
