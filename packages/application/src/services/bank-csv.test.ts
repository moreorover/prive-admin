import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { parseBankCsv } from "./bank-csv"
import { previewBankStatementCsv, importBankStatementCsv } from "./bank-statement-entries"

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

const database = vi.hoisted(() => ({ listBankAccounts: vi.fn(), importBankStatementEntries: vi.fn() }))
vi.mock("@prive-admin-tanstack/db", () => database)

const iban = "LT121000011101001000"
const account = {
  id: "account-1",
  iban: "lt12 1000 0111 0100 1000",
  currency: "EUR",
  displayName: "Main account",
  legalEntity: { id: "entity-1", name: "Prive LT" },
}
function swedbank(accountIban = iban, secondIban = accountIban) {
  return [
    '"Account no","Type","Date","Name","Purpose","Amount","Currency","Direction","Reference"',
    `"${accountIban}","20","2026-11-01","Customer","Invoice","12.34","EUR","K","ref-1"`,
    `"${secondIban}","20","2026-11-02","Customer","Invoice","5.00","EUR","D","ref-2"`,
  ].join("\n")
}

describe("validated statement CSV import", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    database.listBankAccounts.mockResolvedValue([account])
    database.importBankStatementEntries.mockResolvedValue([{ id: "entry-1" }])
  })

  it("previews one normalized exact match without inserting", async () => {
    expect(await previewBankStatementCsv({ csv: swedbank(" lt12 1000 0111 0100 1000 ") })).toEqual({
      accountIban: iban,
      total: 2,
      account: { id: "account-1", displayName: "Main account", legalEntity: { id: "entity-1", name: "Prive LT" } },
    })
    expect(database.importBankStatementEntries).not.toHaveBeenCalled()
  })

  it.each(["", "LT123", "LT131000011101001000", `${iban}EXTRA`])(
    "blocks invalid IBAN %j before writing",
    async (value) => {
      await expect(importBankStatementCsv({ csv: swedbank(value) })).rejects.toMatchObject({ code: "BAD_REQUEST" })
      expect(database.importBankStatementEntries).not.toHaveBeenCalled()
    },
  )

  it("rejects a missing exact match rather than matching a prefix", async () => {
    database.listBankAccounts.mockResolvedValue([{ ...account, iban: `${iban}99` }])
    await expect(previewBankStatementCsv({ csv: swedbank() })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("No bank account configured"),
    })
    await expect(importBankStatementCsv({ csv: swedbank() })).rejects.toMatchObject({ code: "BAD_REQUEST" })
    expect(database.importBankStatementEntries).not.toHaveBeenCalled()
  })

  it("rejects ambiguous normalized matches", async () => {
    database.listBankAccounts.mockResolvedValue([account, { ...account, id: "account-2", iban }])
    await expect(importBankStatementCsv({ csv: swedbank() })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("Multiple"),
    })
    expect(database.importBankStatementEntries).not.toHaveBeenCalled()
  })

  it("rejects mixed account rows", async () => {
    await expect(importBankStatementCsv({ csv: swedbank(iban, "GB82WEST12345698765432") })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    })
    expect(database.importBankStatementEntries).not.toHaveBeenCalled()
  })

  it("revalidates after preview and reports duplicate counts with unchanged monetary mapping", async () => {
    const input = { csv: swedbank() }
    await previewBankStatementCsv(input)
    expect(await importBankStatementCsv(input)).toEqual({ accountIban: iban, total: 2, inserted: 1, skipped: 1 })
    expect(database.importBankStatementEntries).toHaveBeenCalledWith(undefined, {
      accountIban: iban,
      values: [
        expect.objectContaining({
          bankAccountId: "account-1",
          externalRef: "ref-1",
          amount: 1234,
          direction: "C",
          currency: "EUR",
        }),
        expect.objectContaining({
          bankAccountId: "account-1",
          externalRef: "ref-2",
          amount: 500,
          direction: "D",
          currency: "EUR",
        }),
      ],
    })
    database.listBankAccounts.mockResolvedValue([])
    await expect(importBankStatementCsv(input)).rejects.toMatchObject({ code: "BAD_REQUEST" })
    expect(database.importBankStatementEntries).toHaveBeenCalledOnce()
  })

  it("preserves SEB account amounts, currency fallback and reference-based duplicate reporting", async () => {
    const csv = [
      `Statement (${iban})`,
      "header",
      `doc-1;2026-11-01;USD;20.00;Vendor;;GB82WEST12345698765432;Bank;SWIFT;Invoice;seb-ref;;TYPE;;D;18.50;${iban};`,
    ].join("\n")
    expect(await importBankStatementCsv({ csv })).toEqual({ accountIban: iban, total: 1, inserted: 1, skipped: 0 })
    expect(database.importBankStatementEntries).toHaveBeenCalledWith(undefined, {
      accountIban: iban,
      values: [
        expect.objectContaining({
          externalRef: "seb-ref",
          docNumber: "doc-1",
          amount: 1850,
          currency: "EUR",
          direction: "D",
        }),
      ],
    })
  })

  it("does not write for an empty SEB statement", async () => {
    expect(await importBankStatementCsv({ csv: `Statement (${iban})\nheader` })).toEqual({
      accountIban: iban,
      total: 0,
      inserted: 0,
      skipped: 0,
    })
    expect(database.importBankStatementEntries).not.toHaveBeenCalled()
  })
})
