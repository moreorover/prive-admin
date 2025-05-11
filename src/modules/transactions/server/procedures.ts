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

		return transactions.map((transaction) => ({
			...transaction,
			amount: transaction.amount / 100,
		}));
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
					orderId: null,
				},
				orderBy: {
					completedDateBy: "asc",
				},
				include: {
					customer: true,
				}, // Include related allocations
			});

			return transactions.map((transaction) => ({
				...transaction,
				amount: transaction.amount / 100,
			}));
		}),
	getById: protectedProcedure
		.input(z.object({ id: z.string().cuid2().nullable() }))
		.query(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			const transaction = await prisma.transaction.findUnique({
				where: { id },
			});

			if (!transaction) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return { ...transaction, amount: transaction.amount / 100 };
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

			const transactions = await prisma.transaction.findMany({
				where: {
					appointmentId,
				},
				include: {
					customer: includeCustomer,
				},
			});

			return transactions.map((transaction) => ({
				...transaction,
				amount: transaction.amount / 100,
			}));
		}),
	createTransaction: protectedProcedure
		.input(
			z.object({
				transaction: transactionSchema,
				appointmentId: z.string().cuid2().nullish(),
				orderId: z.string().cuid2().nullish(),
				customerId: z.string().cuid2(),
			}),
		)
		.mutation(async ({ input }) => {
			const { transaction, appointmentId, orderId, customerId } = input;

			const c = await prisma.transaction.create({
				data: {
					name: transaction.name,
					notes: transaction.notes,
					amount: transaction.amount * 100,
					type: transaction.type,
					status: transaction.status,
					completedDateBy: transaction.completedDateBy,
					appointmentId,
					orderId,
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
					amount: transaction.amount * 100,
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
