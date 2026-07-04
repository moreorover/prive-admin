import { publicProcedure, router } from "../index"
import { appointmentsRouter } from "./appointments"
import { bankAccountsRouter } from "./bank-accounts"
import { bankStatementAttachmentsRouter } from "./bank-statement-attachments"
import { bankStatementEntriesRouter } from "./bank-statement-entries"
import { cashTransactionsRouter } from "./cash-transactions"
import { customersRouter } from "./customers"
import { dashboardRouter } from "./dashboard"
import { hairAssignedRouter } from "./hair-assigned"
import { hairOrdersRouter } from "./hair-orders"
import { legalEntitiesRouter } from "./legal-entities"
import { notesRouter } from "./notes"
import { reportsRouter } from "./reports"
import { salonsRouter } from "./salons"
import { sessionRouter } from "./session"
import { transactionsRouter } from "./transactions"
import { userSettingsRouter } from "./user-settings"

export const appRouter = router({
  appointments: appointmentsRouter,
  bankAccounts: bankAccountsRouter,
  bankStatementAttachments: bankStatementAttachmentsRouter,
  bankStatementEntries: bankStatementEntriesRouter,
  cashTransactions: cashTransactionsRouter,
  customers: customersRouter,
  dashboard: dashboardRouter,
  hairAssigned: hairAssignedRouter,
  hairOrders: hairOrdersRouter,
  healthCheck: publicProcedure.query(() => "OK"),
  legalEntities: legalEntitiesRouter,
  notes: notesRouter,
  reports: reportsRouter,
  salons: salonsRouter,
  session: sessionRouter,
  transactions: transactionsRouter,
  userSettings: userSettingsRouter,
})

export type AppRouter = typeof appRouter
