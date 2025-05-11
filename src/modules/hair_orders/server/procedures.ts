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
		.input(
			z.object({
				clientId: z.string().cuid2().nullable(),
				appointmentId: z.string().cuid2().nullish(),
			}),
		)
		.query(async ({ input }) => {
			const { clientId, appointmentId } = input;

			if (!clientId) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Missing clientId" });
			}

			const hairAssigned = await prisma.hairAssigned.findMany({
				where: { AND: [{ clientId }, { weightInGrams: 0 }] },
				select: { hairOrderId: true, appointmentId: true },
			});

			const hairOrdersToFilter = hairAssigned
				.filter((hairAssigned) => !hairAssigned.appointmentId)
				.map((hairAssigned) => hairAssigned.hairOrderId);

			const hairOrdersToFilterForAppointment = hairAssigned
				.filter(
					(hairAssigned) =>
						hairAssigned.appointmentId &&
						hairAssigned.appointmentId === appointmentId,
				)
				.map((hairAssigned) => hairAssigned.hairOrderId);

			const hairOrders = await prisma.hairOrder.findMany({
				include: { customer: true },
			});

			if (appointmentId) {
				return hairOrders
					.filter((ho) => !hairOrdersToFilterForAppointment.includes(ho.id))
					.map((hairOrder) => ({
						...hairOrder,
						pricePerGram: hairOrder.pricePerGram / 100,
						total: hairOrder.total / 100,
					}));
			}

			return hairOrders
				.filter((ho) => !hairOrdersToFilter.includes(ho.id))
				.map((hairOrder) => ({
					...hairOrder,
					pricePerGram: hairOrder.pricePerGram / 100,
					total: hairOrder.total / 100,
				}));
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
	create: protectedProcedure
		.input(z.object({ hairOrder: hairOrderSchema }))
		.mutation(async ({ ctx, input }) => {
			const { hairOrder } = input;
			const { user } = ctx;
			const c = await prisma.hairOrder.create({
				data: {
					...hairOrder,
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
					hairAssigned: true,
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

			if (hairOrder.pricePerGram !== pricePerGram) {
				// Update the hairOrder record with the calculated price per gram
				await prisma.hairOrder.update({
					where: { id: hairOrderId },
					data: { pricePerGram },
				});
			}

			// Iterate through hair assigned and calculate total and profit
			for (const hairAssigned of hairOrder.hairAssigned) {
				// If pricePerGram is 0, total is set to 0, otherwise calculate normally
				const total =
					pricePerGram === 0
						? 0
						: Math.round(pricePerGram * hairAssigned.weightInGrams);
				const profit = hairAssigned.soldFor - total;

				// Update the hairAssigned record with calculated total and profit
				await prisma.hairAssigned.update({
					where: { id: hairAssigned.id },
					data: { profit },
				});
			}

			return hairOrder;
		}),
});
