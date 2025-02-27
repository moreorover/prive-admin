import { z } from "zod";
import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { orderItemSchema } from "@/lib/schemas";

export const orderItemsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        orderItem: orderItemSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const { orderItem } = input;

      const createdOrderItem = await prisma.orderItem.create({
        data: {
          orderId: orderItem.orderId,
          productVariantId: orderItem.productVariantId,
          quantity: orderItem.quantity,
          unitPrice: orderItem.unitPrice * 100,
          totalPrice: orderItem.quantity * orderItem.unitPrice * 100,
        },
      });

      return createdOrderItem;
    }),
  update: protectedProcedure
    .input(
      z.object({
        orderItem: orderItemSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const { orderItem } = input;

      const updatedOrderItem = await prisma.orderItem.update({
        data: {
          quantity: orderItem.quantity,
          unitPrice: orderItem.unitPrice * 100,
          totalPrice: orderItem.quantity * orderItem.unitPrice * 100,
        },
        where: { id: orderItem.id },
      });

      return updatedOrderItem;
    }),
  getByOrderId: protectedProcedure
    .input(z.object({ orderId: z.string().cuid2() }))
    .query(async ({ input }) => {
      const { orderId } = input;

      const orderItems = await prisma.orderItem.findMany({
        where: { orderId },
        include: { productVariant: { include: { product: true } } },
      });

      return orderItems;
    }),
  getProductOptionsByOrderId: protectedProcedure
    .input(z.object({ orderId: z.string().cuid2() }))
    .query(async ({ input }) => {
      const { orderId } = input;

      const orderItems = await prisma.orderItem.findMany({
        where: { orderId },
      });

      const productVariantIds = orderItems.map((item) => item.productVariantId);

      const productVariants = await prisma.productVariant.findMany({
        where: { NOT: { id: { in: productVariantIds } }, stock: { gt: 0 } },
        include: { product: true },
      });

      const productOtions = productVariants.map((pv) => ({
        value: pv.id,
        label: `${pv.product.name} ${pv.size}`,
      }));

      return productOtions;
    }),
});
