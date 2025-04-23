import prisma from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { transactionSchema } from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import dayjs from "dayjs";

export const transactionsRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async () => {
		const transactions = await prisma.transaction.findMany({
			include: { customer: true },
		});

		return transactions;
	}),
	getTransactionsBetweenDates: protectedProcedure
		.input(z.object({ startDate: z.string(), endDate: z.string() }))
		.query(async ({ input }) => {
			const { startDate, endDate } = input;
			const startOfWeek = dayjs(startDate).startOf("day");
			const endOfWeek = dayjs(endDate).endOf("day");

			const transactions = await prisma.transaction.findMany({
				where: {
					completedDateBy: {
						gte: startOfWeek.toDate(),
						lte: endOfWeek.toDate(),
					},
				},
				orderBy: {
					completedDateBy: "asc",
				},
				include: {
					customer: true,
				}, // Include related allocations
			});

			return transactions;
		}),
	getTransactionsPageBetweenDates: protectedProcedure
		.input(z.object({ startDate: z.string(), endDate: z.string() }))
		.query(async ({ input }) => {
			const { startDate, endDate } = input;
			const startOfWeek = dayjs(startDate).startOf("day");
			const endOfWeek = dayjs(endDate).endOf("day");

			const transactions = await prisma.transaction.findMany({
				where: {
					completedDateBy: {
						gte: startOfWeek.toDate(),
						lte: endOfWeek.toDate(),
					},
					hairOrderId: null,
					orderId: null,
				},
				orderBy: {
					completedDateBy: "asc",
				},
				include: {
					customer: true,
				}, // Include related allocations
			});

			return transactions;
		}),
	getOne: protectedProcedure
		.input(z.object({ id: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { id } = input;

			const transaction = await prisma.transaction.findUnique({
				where: { id },
			});

			if (!transaction) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return transaction;
		}),
	getByOrderId: protectedProcedure
		.input(
			z.object({
				orderId: z.string().cuid2().nullable(),
				includeCustomer: z.boolean(),
			}),
		)
		.query(async ({ input }) => {
			const { orderId, includeCustomer } = input;

			return prisma.transaction.findMany({
				where: {
					orderId,
				},
				include: {
					customer: includeCustomer,
				},
			});
		}),
	getByAppointmentId: protectedProcedure
		.input(
			z.object({
				appointmentId: z.string().cuid2().nullable(),
				includeCustomer: z.boolean(),
			}),
		)
		.query(async ({ input }) => {
			const { appointmentId, includeCustomer } = input;

			return prisma.transaction.findMany({
				where: {
					appointmentId,
				},
				include: {
					customer: includeCustomer,
				},
			});
		}),
	getByHairOrderId: protectedProcedure
		.input(
			z.object({
				hairOrderId: z.string().cuid2().nullable(),
				includeCustomer: z.boolean(),
			}),
		)
		.query(async ({ input }) => {
			const { hairOrderId, includeCustomer } = input;

			return prisma.transaction.findMany({
				where: {
					hairOrderId,
				},
				include: {
					customer: includeCustomer,
				},
			});
		}),
	createTransaction: protectedProcedure
		.input(
			z.object({
				transaction: transactionSchema,
				appointmentId: z.string().cuid2().nullish(),
				orderId: z.string().cuid2().nullish(),
				hairOrderId: z.string().cuid2().nullish(),
				customerId: z.string().cuid2(),
			}),
		)
		.mutation(async ({ input }) => {
			const { transaction, appointmentId, orderId, hairOrderId, customerId } =
				input;

			const c = await prisma.transaction.create({
				data: {
					name: transaction.name,
					notes: transaction.notes,
					amount: transaction.amount,
					type: transaction.type,
					status: transaction.status,
					completedDateBy: transaction.completedDateBy,
					appointmentId,
					orderId,
					hairOrderId,
					customerId,
				},
			});

			return c;
		}),
	update: protectedProcedure
		.input(z.object({ transaction: transactionSchema }))
		.mutation(async ({ input }) => {
			const { transaction } = input;

			const c = await prisma.transaction.update({
				data: {
					name: transaction.name,
					notes: transaction.notes,
					amount: transaction.amount,
					type: transaction.type,
					status: transaction.status,
					completedDateBy: transaction.completedDateBy,
				},
				where: { id: transaction.id },
			});

			return c;
		}),
	delete: protectedProcedure
		.input(
			z.object({
				id: z.string().cuid2(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id } = input;

			const transaction = await prisma.transaction.findUnique({
				where: { id },
			});

			if (!transaction) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			const c = await prisma.transaction.delete({
				where: { id },
			});

			return c;
		}),
});
