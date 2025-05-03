import prisma from "@/lib/prisma";
import { hairAssignedToSaleSchema, hairSaleSchema } from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const hairSalesRouter = createTRPCRouter({
	getAll: protectedProcedure.query(() => {
		return prisma.hairSale.findMany({
			include: { createdBy: true, customer: true },
			orderBy: { placedAt: "desc" },
		});
	}),
	getById: protectedProcedure
		.input(z.object({ hairSaleId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { hairSaleId } = input;

			const hairSale = await prisma.hairSale.findFirst({
				where: { id: hairSaleId },
				include: { createdBy: true, customer: true },
			});

			if (!hairSale) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return hairSale;
		}),
	getByCustomerId: protectedProcedure
		.input(z.object({ customerId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { customerId } = input;

			const hairSales = await prisma.hairSale.findMany({
				where: { customerId },
				include: { createdBy: true, customer: true },
				orderBy: { placedAt: "desc" },
			});

			return hairSales;
		}),
	create: protectedProcedure
		.input(z.object({ customerId: z.string().cuid2() }))
		.mutation(async ({ input, ctx }) => {
			const { customerId } = input;
			const { user } = ctx;

			const hairSale = await prisma.hairSale.create({
				data: { customerId, createdById: user.id },
			});

			return hairSale;
		}),
	update: protectedProcedure
		.input(z.object({ hairSale: hairSaleSchema }))
		.mutation(async ({ input }) => {
			const { hairSale } = input;

			console.log({ hairSale });

			const hairSaleUpdated = await prisma.hairSale.update({
				where: { id: hairSale.id },
				data: {
					placedAt: hairSale.placedAt,
					weightInGrams: hairSale.weightInGrams,
					pricePerGram: hairSale.pricePerGram,
				},
			});

			if (!hairSaleUpdated) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return hairSaleUpdated;
		}),
	getHairAssignments: protectedProcedure
		.input(z.object({ hairSaleId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { hairSaleId } = input;
			const hairAssignments = await prisma.hairAssignedToSale.findMany({
				where: { hairSaleId },
				include: { hairOrder: true },
			});

			return hairAssignments;
		}),
	getHairSaleOptions: protectedProcedure
		.input(z.object({ hairSaleId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { hairSaleId } = input;
			return prisma.hairOrder.findMany({
				where: {
					hairAssignedToSale: {
						none: {
							hairSaleId,
						},
					},
				},
				include: { createdBy: true, customer: true },
				orderBy: { uid: "asc" },
			});
		}),
	createHairAssignment: protectedProcedure
		.input(
			z.object({
				hairSaleId: z.string().cuid2(),
				hairOrderId: z.string().cuid2(),
			}),
		)
		.mutation(async ({ input }) => {
			const { hairSaleId, hairOrderId } = input;

			const c = await prisma.hairAssignedToSale.create({
				data: {
					hairSaleId,
					hairOrderId,
				},
			});
			return c;
		}),
	deleteHairAssignment: protectedProcedure
		.input(z.object({ hairAssignmentId: z.string().cuid2() }))
		.mutation(async ({ input }) => {
			const { hairAssignmentId } = input;

			const hairAssignment = await prisma.hairAssignedToSale.delete({
				where: { id: hairAssignmentId },
			});

			const totalWeightInGrams = await prisma.hairAssignedToSale.aggregate({
				where: { hairOrderId: hairAssignment.hairOrderId },
				_sum: {
					weightInGrams: true,
				},
			});

			await prisma.hairSale.update({
				where: { id: hairAssignment.hairOrderId },
				data: { weightInGrams: totalWeightInGrams._sum.weightInGrams ?? 0 },
			});

			return hairAssignment;
		}),
	updateHairAssignment: protectedProcedure
		.input(
			z.object({
				hairAssignment: hairAssignedToSaleSchema,
			}),
		)
		.mutation(async ({ input }) => {
			const { hairAssignment } = input;

			const hairAssignmentSaved = await prisma.hairAssignedToSale.findUnique({
				where: { id: hairAssignment.id },
				include: { hairOrder: true },
			});

			if (!hairAssignmentSaved) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			const total =
				hairAssignmentSaved.hairOrder.pricePerGram *
				hairAssignment.weightInGrams;

			const soldFor = hairAssignment.soldFor * 100;

			const hairAssignmentUpdated = await prisma.hairAssignedToSale.update({
				data: {
					weightInGrams: hairAssignment.weightInGrams,
					soldFor,
					profit: soldFor - total,
				},
				where: { id: hairAssignment.id },
			});

			const totalWeightInGramsForAppointment =
				await prisma.hairAssignedToAppointment.aggregate({
					where: { hairOrderId: hairAssignment.hairOrderId },
					_sum: {
						weightInGrams: true,
						soldFor: true,
					},
				});

			const totalWeightInGramsForSale2 =
				await prisma.hairAssignedToSale.aggregate({
					where: { hairOrderId: hairAssignment.hairOrderId },
					_sum: {
						weightInGrams: true,
						soldFor: true,
					},
				});

			const totalWeightInGramsForSale =
				await prisma.hairAssignedToSale.aggregate({
					where: { hairSaleId: hairAssignment.hairSaleId },
					_sum: {
						weightInGrams: true,
						soldFor: true,
					},
				});

			const totalWeightInGrams =
				(totalWeightInGramsForSale2._sum.weightInGrams ?? 0) +
				(totalWeightInGramsForAppointment._sum.weightInGrams ?? 0);

			await prisma.hairOrder.update({
				where: { id: hairAssignment.hairOrderId },
				data: { weightUsed: totalWeightInGrams },
			});

			await prisma.hairSale.update({
				where: { id: hairAssignment.hairSaleId },
				data: {
					weightInGrams: totalWeightInGramsForSale._sum.weightInGrams ?? 0,
					pricePerGram:
						(totalWeightInGramsForSale._sum.soldFor ?? 0) /
						(totalWeightInGramsForSale._sum.weightInGrams ?? 0),
				},
			});

			return hairAssignmentUpdated;
		}),
});
