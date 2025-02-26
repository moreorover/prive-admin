import { appointmentsRouter } from "@/modules/appointments/server/procedures";
import { customersRouter } from "@/modules/customers/server/procedures";
import { ordersRouter } from "@/modules/orders/server/procedures";
import { productsRouter } from "@/modules/products/server/procedures";
import { productVariantsRouter } from "@/modules/product_variants/server/procedures";
import { transactionsRouter } from "@/modules/transactions/server/procedures";

import { createTRPCRouter } from "@/trpc/init";
import { orderItemsRouter } from "@/modules/order_item/server/procedures";
import { transactionAllocationsRouter } from "@/modules/transaction_allocations/server/procedures";

export const appRouter = createTRPCRouter({
  appointments: appointmentsRouter,
  customers: customersRouter,
  orders: ordersRouter,
  orderItems: orderItemsRouter,
  products: productsRouter,
  productVariants: productVariantsRouter,
  transactions: transactionsRouter,
  transactionAllocations: transactionAllocationsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
