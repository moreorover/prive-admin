import { z } from "zod"

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
  })
  .superRefine((values, ctx) => {
    const amount = values.amountMajor
    if (!Number.isSafeInteger(amount) || amount === 0) {
      ctx.addIssue({ code: "custom", path: ["amountMajor"], message: "Enter a nonzero amount in minor units" })
    }
  })
  .transform((values) => ({
    name: values.name.trim() || null,
    notes: values.notes.trim() || null,
    amount: values.amountMajor,
    currency: values.currency,
  }))

export type TransactionFormSubmit = z.output<typeof transactionFormSchema>
