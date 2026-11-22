import { z } from "zod"

export const MOVEMENT_TYPE_OPTIONS = [
  { value: "received", label: "Received money" },
  { value: "personnel_allocation", label: "Personnel allocation" },
  { value: "refund", label: "Refund" },
  { value: "adjustment", label: "Adjustment" },
] as const

export const transactionFormSchema = z
  .object({
    name: z.string(),
    notes: z.string(),
    amountMajor: z
      .union([z.string(), z.number().finite()])
      .transform(String)
      .pipe(z.string().regex(/^-?(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/, "Enter an amount with up to two decimal places"))
      .transform((decimal) => {
        const [whole, fraction = ""] = decimal.split(".")
        return Number(whole + fraction.padEnd(2, "0"))
      }),
    currency: z.enum(["EUR", "GBP"]),
    movementType: z.enum(["received", "personnel_allocation", "refund", "adjustment"], {
      error: "Choose a movement type",
    }),
  })
  .superRefine((values, ctx) => {
    const amount = values.amountMajor
    if (!Number.isSafeInteger(amount) || amount === 0) {
      ctx.addIssue({ code: "custom", path: ["amountMajor"], message: "Enter a nonzero amount in minor units" })
    } else if (values.movementType === "received" && amount < 0) {
      ctx.addIssue({ code: "custom", path: ["amountMajor"], message: "Received money must be positive" })
    } else if ((values.movementType === "refund" || values.movementType === "personnel_allocation") && amount > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMajor"],
        message: "Refunds and personnel allocations must be negative",
      })
    }
  })
  .transform((values) => ({
    name: values.name.trim() || null,
    notes: values.notes.trim() || null,
    amount: values.amountMajor,
    currency: values.currency,
    movementType: values.movementType,
  }))

export type TransactionFormSubmit = z.output<typeof transactionFormSchema>
