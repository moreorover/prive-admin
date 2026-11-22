import type { UseFormInput } from "@mantine/form"
import type { ComponentProps, ReactNode } from "react"

import { MantineProvider } from "@mantine/core"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { CreateTransactionDialog } from "./create-transaction-dialog"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { TransactionForm } from "./transaction-form"
import { transactionFormSchema } from "./transaction-form-data"

// Keep Mantine validation and form state real; expose the DOM submit boundary in this Node suite.
const submissions = vi.hoisted(() => [] as Array<() => void>)
const edits = vi.hoisted(() => [] as Array<(values: Record<string, unknown>) => void>)
vi.mock("@mantine/form", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mantine/form")>()
  return {
    ...actual,
    useForm: <T extends Record<string, unknown>>(input: UseFormInput<T>) => {
      const form = actual.useForm(input)
      edits.push((values) => form.setValues(values as Partial<T>))
      const onSubmit = form.onSubmit
      form.onSubmit = (...args) => {
        const handler = onSubmit(...args)
        submissions.push(() => handler())
        return handler
      }
      return form
    },
  }
})
// Modal portals do not render on the server. Only replace that presentation boundary.
vi.mock("@mantine/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mantine/core")>()),
  Modal: ({ opened, children }: { opened: boolean; children: ReactNode }) => (opened ? children : null),
}))
beforeEach(() => {
  submissions.length = 0
  edits.length = 0
})

const base = { name: " Payment ", notes: " ", amountMajor: 12.34, currency: "EUR" }

describe("explicit transaction movements", () => {
  it.each([undefined, "", "legacy_unclassified", "unknown"])(
    "rejects an unchosen or unwritable movement %s",
    (movementType) => {
      expect(transactionFormSchema.safeParse({ ...base, movementType }).success).toBe(false)
    },
  )

  it.each([
    ["received", 12.34, 1234],
    ["personnel_allocation", -60, -6000],
    ["refund", -10, -1000],
    ["adjustment", -1, -100],
    ["adjustment", 1, 100],
  ])("submits the chosen %s with signed minor units", (movementType, amountMajor, amount) => {
    expect(transactionFormSchema.parse({ ...base, movementType, amountMajor })).toEqual({
      name: "Payment",
      notes: null,
      currency: "EUR",
      movementType,
      amount,
    })
  })

  it.each([
    ["received", -1],
    ["refund", 1],
    ["personnel_allocation", 1],
    ["adjustment", 0],
    ["received", 0.001],
    ["adjustment", Infinity],
    ["adjustment", Number.MAX_SAFE_INTEGER],
  ])("rejects invalid signed amounts %s / %s", (movementType, amountMajor) => {
    expect(transactionFormSchema.safeParse({ ...base, movementType, amountMajor }).success).toBe(false)
  })

  it("renders all four choices and an empty prompt without inferring a movement", () => {
    const html = renderToStaticMarkup(
      createElement(
        MantineProvider,
        null,
        createElement(TransactionForm, {
          initialValues: { ...base, currency: "EUR", movementType: "" },
          submitLabel: "Create",
          onSubmit: () => {},
        }),
      ),
    )
    for (const label of [
      "Movement type",
      "Choose movement type",
      "Received money",
      "Personnel allocation",
      "Refund",
      "Adjustment",
    ])
      expect(html).toContain(label)
    expect(html).toMatch(/<option[^>]*value=""[^>]*selected/)
  })
})

it("does not submit a new transaction until a movement is chosen", () => {
  const onCreate = vi.fn<ComponentProps<typeof CreateTransactionDialog>["onCreate"]>()
  renderToStaticMarkup(
    createElement(
      MantineProvider,
      null,
      createElement(CreateTransactionDialog, {
        open: true,
        onOpenChange: () => {},
        appointmentId: "appt",
        customerId: "client",
        defaultCurrency: "EUR",
        onCreate,
      }),
    ),
  )
  submissions[0]()
  expect(onCreate).not.toHaveBeenCalled()
})

it.each(["received", "personnel_allocation", "refund", "adjustment"] as const)(
  "keeps an existing explicit %s when editing and forwards the full update payload",
  (movementType) => {
    const onUpdate = vi.fn<ComponentProps<typeof EditTransactionDialog>["onUpdate"]>()
    const amount = movementType === "received" ? 1234 : -1234
    const html = renderToStaticMarkup(
      createElement(
        MantineProvider,
        null,
        createElement(EditTransactionDialog, {
          open: true,
          onOpenChange: () => {},
          transaction: { id: "tx", name: " Payment ", notes: " ", amount, currency: "GBP", movementType },
          onUpdate,
        }),
      ),
    )
    expect(html).toContain(`value="${movementType}" selected`)
    submissions[0]()
    expect(onUpdate).toHaveBeenCalledWith({
      id: "tx",
      movementType,
      name: "Payment",
      notes: null,
      amount,
      currency: "GBP",
    })
  },
)

it("requires an explicit classification before saving a legacy transaction", () => {
  const onUpdate = vi.fn<ComponentProps<typeof EditTransactionDialog>["onUpdate"]>()
  const html = renderToStaticMarkup(
    createElement(
      MantineProvider,
      null,
      createElement(EditTransactionDialog, {
        open: true,
        onOpenChange: () => {},
        transaction: {
          id: "legacy",
          name: null,
          notes: null,
          amount: 1234,
          currency: "EUR",
          movementType: "legacy_unclassified",
        },
        onUpdate,
      }),
    ),
  )
  expect(html).toMatch(/<option[^>]*value=""[^>]*selected/)
  submissions[0]()
  expect(onUpdate).not.toHaveBeenCalled()
})

it.each(["received", "personnel_allocation", "refund", "adjustment"] as const)(
  "submits a newly chosen %s with appointment and counterparty IDs",
  (movementType) => {
    const onCreate = vi.fn<ComponentProps<typeof CreateTransactionDialog>["onCreate"]>()
    renderToStaticMarkup(
      createElement(
        MantineProvider,
        null,
        createElement(CreateTransactionDialog, {
          open: true,
          onOpenChange: () => {},
          appointmentId: "appt",
          customerId: "person",
          defaultCurrency: "EUR",
          onCreate,
        }),
      ),
    )
    const amountMajor = movementType === "received" ? 12.34 : -12.34
    edits[0]({ movementType, amountMajor })
    submissions[0]()
    expect(onCreate).toHaveBeenCalledWith({
      appointmentId: "appt",
      customerId: "person",
      movementType,
      amount: Math.round(amountMajor * 100),
      currency: "EUR",
      name: null,
      notes: null,
    })
  },
)

it("shows the stored currency and blocks ordinary editing until it is resolved", () => {
  const html = renderToStaticMarkup(
    <MantineProvider>
      <EditTransactionDialog
        open
        onOpenChange={() => {}}
        transaction={{ id: "legacy", name: null, notes: null, amount: 1234, currency: "USD" }}
        onUpdate={() => {}}
      />
    </MantineProvider>,
  )
  expect(html).toContain("USD")
  expect(html).not.toContain("Movement type")
  expect(submissions).toHaveLength(0)
})

it("preserves the exact minor units when editing at the safe-integer boundary", () => {
  const onUpdate = vi.fn<ComponentProps<typeof EditTransactionDialog>["onUpdate"]>()
  const amount = Number.MAX_SAFE_INTEGER - 1
  renderToStaticMarkup(
    <MantineProvider>
      <EditTransactionDialog
        open
        onOpenChange={() => {}}
        transaction={{ id: "tx", name: null, notes: null, amount, currency: "GBP", movementType: "received" }}
        onUpdate={onUpdate}
      />
    </MantineProvider>,
  )
  submissions[0]()
  expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ amount }))
})
