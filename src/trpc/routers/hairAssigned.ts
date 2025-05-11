import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { z } from "zod";

dayjs.extend(isoWeek);

export const hairAssignedRouter = createTRPCRouter({
	getById: protectedProcedure
		.input(z.object({ id: z.string().cuid2().nullable() }))
		.query(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Missing id" });
			}

			const hairAssigned = await prisma.hairAssigned.findUnique({
				where: { id },
				include: { hairOrder: true },
			});

			if (!hairAssigned) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return {
				...hairAssigned,
				soldFor: hairAssigned.soldFor / 100,
				profit: hairAssigned.profit / 100,
				pricePerGram: hairAssigned.pricePerGram / 100,
			};
		}),
	getByAppointmentId: protectedProcedure
		.input(z.object({ appointmentId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { appointmentId } = input;

			const hairAssigned = await prisma.hairAssigned.findMany({
				where: { appointmentId },
			});

			return hairAssigned.map((h) => ({
				...h,
				soldFor: h.soldFor / 100,
				profit: h.profit / 100,
				pricePerGram: h.pricePerGram / 100,
			}));
		}),
	getByHairOrderId: protectedProcedure
		.input(z.object({ hairOrderId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { hairOrderId } = input;

			const hairAssigned = await prisma.hairAssigned.findMany({
				where: { hairOrderId },
				include: { client: true },
			});

			return hairAssigned.map((h) => ({
				...h,
				soldFor: h.soldFor / 100,
				profit: h.profit / 100,
				pricePerGram: h.pricePerGram / 100,
			}));
		}),
	getByClientId: protectedProcedure
		.input(z.object({ clientId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { clientId } = input;

			const hairAssigned = await prisma.hairAssigned.findMany({
				where: { clientId },
			});

			return hairAssigned.map((h) => ({
				...h,
				soldFor: h.soldFor / 100,
				profit: h.profit / 100,
				pricePerGram: h.pricePerGram / 100,
			}));
		}),
	getBy: protectedProcedure
		.input(
			z.object({
				clientId: z.union([z.string().cuid2(), z.undefined()]),
				appointmentId: z.string().cuid2().nullish(),
				hairOrderId: z.union([z.string().cuid2(), z.undefined()]),
			}),
		)
		.query(async ({ input }) => {
			const { clientId, appointmentId, hairOrderId } = input;

			const hairAssigned = await prisma.hairAssigned.findMany({
				where: { clientId, appointmentId, hairOrderId },
				include: { hairOrder: true },
			});

			return hairAssigned.map((h) => ({
				...h,
				soldFor: h.soldFor / 100,
				profit: h.profit / 100,
				pricePerGram: h.pricePerGram / 100,
			}));
		}),
	create: protectedProcedure
		.input(
			z.object({
				hairOrderId: z.string().cuid2(),
				appointmentId: z.string().cuid2().nullish(),
				clientId: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { hairOrderId, appointmentId, clientId } = input;

			if (!hairOrderId || !clientId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Missing clientId",
				});
			}

			const hairAssigned = await prisma.hairAssigned.create({
				data: {
					hairOrderId,
					appointmentId,
					clientId,
					createdById: ctx.user.id,
				},
			});
			return hairAssigned;
		}),
	update: protectedProcedure
		.input(
			z.object({
				hairAssigned: z.object({
					id: z.string().cuid2(),
					weightInGrams: z.number(),
					soldFor: z.number(),
					hairOrderId: z.string().cuid2(),
				}),
			}),
		)
		.mutation(async ({ input }) => {
			const { hairAssigned } = input;

			const hairOrder = await prisma.hairOrder.findUnique({
				where: { id: hairAssigned.hairOrderId },
			});

			if (!hairOrder) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Missing hairOrder",
				});
			}

			if (
				hairOrder.weightReceived - hairOrder.weightUsed <
				hairAssigned.weightInGrams
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Not sufficient stock!",
				});
			}

			const hairAssignedSaved = await prisma.hairAssigned.update({
				data: {
					weightInGrams: hairAssigned.weightInGrams,
					soldFor: hairAssigned.soldFor * 100,
					profit:
						hairAssigned.soldFor * 100 -
						hairAssigned.weightInGrams * hairOrder.pricePerGram,
					pricePerGram: Math.round(
						(hairAssigned.soldFor * 100) / hairAssigned.weightInGrams,
					),
				},
				where: { id: hairAssigned.id },
			});

			const totalWeightUsed = await prisma.hairAssigned.aggregate({
				where: { hairOrderId: hairAssigned.hairOrderId },
				_sum: {
					weightInGrams: true,
				},
			});

			await prisma.hairOrder.update({
				where: { id: hairAssigned.hairOrderId },
				data: { weightUsed: totalWeightUsed._sum.weightInGrams ?? 0 },
			});

			return hairAssignedSaved;
		}),
	delete: protectedProcedure
		.input(
			z.object({
				id: z.string().cuid2().nullable(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Missing id",
				});
			}

			const hairAssigned = await prisma.hairAssigned.delete({
				where: { id },
			});

			if (!hairAssigned) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Missing id",
				});
			}

			const totalWeightUsed = await prisma.hairAssigned.aggregate({
				where: { hairOrderId: hairAssigned.hairOrderId },
				_sum: {
					weightInGrams: true,
				},
			});

			await prisma.hairOrder.update({
				where: { id: hairAssigned.hairOrderId },
				data: { weightUsed: totalWeightUsed._sum.weightInGrams ?? 0 },
			});

			return hairAssigned;
		}),
});
