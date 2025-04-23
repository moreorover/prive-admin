import prisma from "@/lib/prisma";
import { hairOrderSchema, hairOrderTotalWeightSchema } from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const hairOrderRouter = createTRPCRouter({
	getAll: protectedProcedure.query(() => {
		return prisma.hairOrder.findMany({
			include: { createdBy: true, customer: true },
		});
	}),
	getHairOrderOptions: protectedProcedure
		.input(z.object({ appointmentId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { appointmentId } = input;
			return prisma.hairOrder.findMany({
				where: {
					hairAssignedToAppointment: {
						none: {
							appointmentId,
						},
					},
				},
				include: { createdBy: true, customer: true },
				orderBy: { id: "asc" },
			});
		}),
	getById: protectedProcedure
		.input(z.object({ id: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { id } = input;
			const hairOrder = await prisma.hairOrder.findFirst({
				where: { id },
				include: { createdBy: true, customer: true },
			});

			if (!hairOrder) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return { ...hairOrder, pricePerGram: hairOrder.pricePerGram / 100 };
		}),
	create: protectedProcedure.mutation(async ({ ctx }) => {
		const { user } = ctx;
		const c = await prisma.hairOrder.create({
			data: {
				createdById: user.id,
			},
		});
		return c;
	}),
	update: protectedProcedure
		.input(z.object({ hairOrder: hairOrderSchema }))
		.mutation(async ({ input }) => {
			const { hairOrder } = input;
			const c = await prisma.hairOrder.update({
				data: hairOrder,
				where: { id: hairOrder.id },
			});
			return c;
		}),
	updateTotalWeight: protectedProcedure
		.input(z.object({ hairOrder: hairOrderTotalWeightSchema }))
		.mutation(async ({ input }) => {
			const { hairOrder } = input;
			const c = await prisma.hairOrder.update({
				data: hairOrder,
				where: { id: hairOrder.id },
			});
			return c;
		}),
	recalculatePrices: protectedProcedure
		.input(z.object({ hairOrderId: z.string().cuid2() }))
		.mutation(async ({ input }) => {
			const { hairOrderId } = input;
			const hairOrder = await prisma.hairOrder.findUnique({
				where: { id: hairOrderId },
				include: { transactions: true, hairAssignedToAppointment: true },
			});

			if (!hairOrder) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			const transactionsTotal = hairOrder.transactions.reduce(
				(sum, transaction) => sum + transaction.amount,
				0,
			);

			const pricePerGram = Math.abs(
				Math.round((transactionsTotal / hairOrder.weightReceived) * 100),
			);

			await prisma.hairOrder.update({
				where: { id: hairOrderId },
				data: { pricePerGram },
			});

			for (const hairAssignedToAppointment of hairOrder.hairAssignedToAppointment) {
				await prisma.hairAssignedToAppointment.update({
					where: { id: hairAssignedToAppointment.id },
					data: {
						total: Math.round(
							pricePerGram * hairAssignedToAppointment.weightInGrams,
						),
					},
				});
			}

			return hairOrder;
		}),
	getHairAssignments: protectedProcedure
		.input(z.object({ hairOrderId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { hairOrderId } = input;
			const hairAssignments = await prisma.hairAssignedToAppointment.findMany({
				where: { hairOrderId },
			});

			return hairAssignments;
		}),
});
