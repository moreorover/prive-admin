import { appointmentsRouter } from "@/modules/appointments/server/procedures";
import { customersRouter } from "@/modules/customers/server/procedures";
import { ordersRouter } from "@/modules/orders/server/procedures";
import { productsRouter } from "@/modules/products/server/procedures";
import { transactionsRouter } from "@/modules/transactions/server/procedures";

import { createTRPCRouter } from "@/trpc/init";

export const appRouter = createTRPCRouter({
  appointments: appointmentsRouter,
  customers: customersRouter,
  orders: ordersRouter,
  products: productsRouter,
  transactions: transactionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
