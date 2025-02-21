import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { orderSchema } from "@/lib/schemas";

dayjs.extend(isoWeek);

export const ordersRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const orders = await prisma.order.findMany({
      include: { customer: true },
    });

    return orders;
  }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const order = await prisma.order.findUnique({
        where: { id },
        include: { customer: true, transactions: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return order;
    }),
  create: protectedProcedure
    .input(z.object({ order: orderSchema, customerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { order, customerId } = input;

      const c = await prisma.order.create({
        data: {
          type: order.type,
          status: order.status,
          placedAt: order.placedAt,
          customerId,
        },
      });
      return c;
    }),
  update: protectedProcedure
    .input(z.object({ order: orderSchema }))
    .mutation(async ({ input, ctx }) => {
      const { order } = input;

      const c = await prisma.order.update({
        data: {
          type: order.type,
          status: order.status,
          placedAt: order.placedAt,
        },
        where: { id: order.id },
      });
      return c;
    }),
  getOrdersForWeek: protectedProcedure
    .input(z.object({ offset: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const { offset } = input;
      const startOfWeek = dayjs()
        .isoWeekday(1)
        .add(offset, "week")
        .startOf("day"); // Monday start
      const endOfWeek = dayjs().isoWeekday(7).add(offset, "week").endOf("day"); // Sunday end

      const orders = await prisma.order.findMany({
        where: {
          placedAt: {
            gte: startOfWeek.toDate(),
            lte: endOfWeek.toDate(),
          },
        },
        include: {
          customer: true,
        },
      });

      return orders;
    }),
  getOrdersByCustomerId: protectedProcedure
    .input(z.object({ customerId: z.string().cuid2() }))
    .query(async ({ input, ctx }) => {
      const { customerId } = input;

      const orders = await prisma.order.findMany({
        where: { customerId },
        include: { customer: true },
      });

      return orders;
    }),
});
