import { appointmentsRouter } from "@/modules/appointments/server/procedures";
import { appointmentNotesRouter } from "@/modules/appointment_notes/server/procedures";
import { customersRouter } from "@/modules/customers/server/procedures";
import { hairOrderRouter } from "@/modules/hair-orders/server/procedures";
import { ordersRouter } from "@/modules/orders/server/procedures";
import { productsRouter } from "@/modules/products/server/procedures";
import { productVariantsRouter } from "@/modules/product_variants/server/procedures";
import { createTRPCRouter } from "@/trpc/init";
import { orderItemsRouter } from "@/modules/order_item/server/procedures";
import { transactionsRouter } from "@/modules/transactions/server/procedures";
import { hairOrderNotesRouter } from "@/modules/hair_order_notes/server/procedures";
import { hairRouter } from "@/modules/hair/server/procedures";

export const appRouter = createTRPCRouter({
  appointments: appointmentsRouter,
  appointmentNotes: appointmentNotesRouter,
  customers: customersRouter,
  hair: hairRouter,
  hairOrders: hairOrderRouter,
  hairOrderNotes: hairOrderNotesRouter,
  orders: ordersRouter,
  orderItems: orderItemsRouter,
  products: productsRouter,
  productVariants: productVariantsRouter,
  transactions: transactionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
