import prisma from "@/lib/prisma";
import { hairOrderSchema } from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const hairOrderRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async () => {
		const hairOrders = await prisma.hairOrder.findMany({
			include: { createdBy: true, customer: true },
			orderBy: { uid: "asc" },
		});

		return hairOrders;
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
				orderBy: { uid: "asc" },
			});
		}),
	getById: protectedProcedure
		.input(z.object({ id: z.string().cuid2().nullable() }))
		.query(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Missing id" });
			}

			const hairOrder = await prisma.hairOrder.findFirst({
				where: { id },
				include: { createdBy: true, customer: true },
			});

			if (!hairOrder) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return {
				...hairOrder,
				pricePerGram: hairOrder.pricePerGram / 100,
				total: hairOrder.total / 100,
			};
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
				data: {
					...hairOrder,
					total: hairOrder.total * 100,
				},
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
				include: {
					hairAssignedToAppointment: true,
					hairAssignedToSale: true,
				},
			});

			if (!hairOrder) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			// Calculate price per gram, setting it to 0 if total or weightReceived is 0
			const pricePerGram =
				hairOrder.total === 0 || hairOrder.weightReceived === 0
					? 0
					: Math.abs(Math.round(hairOrder.total / hairOrder.weightReceived));

			// Update the hairOrder record with the calculated price per gram
			await prisma.hairOrder.update({
				where: { id: hairOrderId },
				data: { pricePerGram },
			});

			// Iterate through hair assigned to appointments and calculate total and profit
			for (const hairAssignedToAppointment of hairOrder.hairAssignedToAppointment) {
				// If pricePerGram is 0, total is set to 0, otherwise calculate normally
				const total =
					pricePerGram === 0
						? 0
						: Math.round(
								pricePerGram * hairAssignedToAppointment.weightInGrams,
							);
				const profit = hairAssignedToAppointment.soldFor - total;

				// Update the hairAssignedToAppointment record with calculated total and profit
				await prisma.hairAssignedToAppointment.update({
					where: { id: hairAssignedToAppointment.id },
					data: { total, profit },
				});
			}

			// Iterate through hair assigned to sales and calculate profit
			for (const hairAssignedToSale of hairOrder.hairAssignedToSale) {
				// If pricePerGram is 0, total is set to 0, otherwise calculate normally
				const total =
					pricePerGram === 0
						? 0
						: Math.round(pricePerGram * hairAssignedToSale.weightInGrams);
				const profit = hairAssignedToSale.soldFor - total;

				// Update the hairAssignedToSale record with calculated profit
				await prisma.hairAssignedToSale.update({
					where: { id: hairAssignedToSale.id },
					data: { profit },
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

			return hairAssignments.map((hairAssignment) => ({
				...hairAssignment,
				total: hairAssignment.total / 100,
				soldFor: hairAssignment.soldFor / 100,
				profit: hairAssignment.profit / 100,
			}));
		}),
	getHairSales: protectedProcedure
		.input(z.object({ hairOrderId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { hairOrderId } = input;
			const hairAssignments = await prisma.hairAssignedToSale.findMany({
				where: { hairOrderId },
			});

			return hairAssignments.map((hairAssignment) => ({
				...hairAssignment,
				soldFor: hairAssignment.soldFor / 100,
				profit: hairAssignment.profit / 100,
			}));
		}),
});
