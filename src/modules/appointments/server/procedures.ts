import prisma from "@/lib/prisma";
import {
	appointmentNoteSchema,
	appointmentSchema,
	hairAssignedToAppointmentSchema,
} from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { z } from "zod";

dayjs.extend(isoWeek);

export const appointmentsRouter = createTRPCRouter({
	getById: protectedProcedure
		.input(z.object({ id: z.string().cuid2().nullable() }))
		.query(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Missing id" });
			}

			const appointment = await prisma.appointment.findUnique({
				where: { id },
				include: { client: true },
			});

			if (!appointment) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return appointment;
		}),
	create: protectedProcedure
		.input(z.object({ appointment: appointmentSchema, clientId: z.string() }))
		.mutation(async ({ input }) => {
			const { appointment, clientId } = input;

			const c = await prisma.appointment.create({
				data: {
					name: appointment.name,
					startsAt: appointment.startsAt,
					clientId,
				},
			});
			return c;
		}),
	update: protectedProcedure
		.input(z.object({ appointment: appointmentSchema }))
		.mutation(async ({ input }) => {
			const { appointment } = input;

			const c = await prisma.appointment.update({
				data: {
					name: appointment.name,
					startsAt: appointment.startsAt,
				},
				where: { id: appointment.id },
			});
			return c;
		}),
	linkPersonnelWithAppointment: protectedProcedure
		.input(
			z.object({ personnel: z.array(z.string()), appointmentId: z.string() }),
		)
		.mutation(async ({ input }) => {
			const { personnel, appointmentId } = input;

			const data = personnel.map((p) => ({
				appointmentId,
				personnelId: p,
			}));

			const c = await prisma.personnelOnAppointments.createMany({ data });

			return c;
		}),
	getAppointmentsForWeek: protectedProcedure
		.input(z.object({ offset: z.number().int() }))
		.query(async ({ input }) => {
			const { offset } = input;
			const startOfWeek = dayjs()
				.isoWeekday(1)
				.add(offset, "week")
				.startOf("day"); // Monday start
			const endOfWeek = dayjs().isoWeekday(7).add(offset, "week").endOf("day"); // Sunday end

			const appointments = await prisma.appointment.findMany({
				where: {
					startsAt: {
						gte: startOfWeek.toDate(),
						lte: endOfWeek.toDate(),
					},
				},
				include: {
					client: true,
				},
			});

			return appointments;
		}),
	getAppointmentsBetweenDates: protectedProcedure
		.input(z.object({ startDate: z.string(), endDate: z.string() }))
		.query(async ({ input }) => {
			const { startDate, endDate } = input;
			const startOfWeek = dayjs(startDate).startOf("day");
			const endOfWeek = dayjs(endDate).endOf("day");

			const appointments = await prisma.appointment.findMany({
				where: {
					startsAt: {
						gte: startOfWeek.toDate(),
						lte: endOfWeek.toDate(),
					},
				},
				orderBy: {
					startsAt: "asc",
				},
				include: {
					client: true,
				},
			});

			return appointments;
		}),
	getAppointmentsByCustomerId: protectedProcedure
		.input(z.object({ customerId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { customerId } = input;

			const appointments = await prisma.appointment.findMany({
				where: {
					clientId: customerId,
				},
			});

			return appointments;
		}),
	createNote: protectedProcedure
		.input(z.object({ appointmentId: z.string().cuid2(), note: z.string() }))
		.mutation(async ({ input }) => {
			const { appointmentId, note } = input;

			const c = await prisma.appointmentNote.create({
				data: {
					note: note,
					appointmentId,
				},
			});
			return c;
		}),
	updateNote: protectedProcedure
		.input(z.object({ note: appointmentNoteSchema }))
		.mutation(async ({ input }) => {
			const { note } = input;

			const c = await prisma.appointmentNote.update({
				data: {
					note: note.note,
				},
				where: {
					id: note.id,
				},
			});
			return c;
		}),
	createHairAssignment: protectedProcedure
		.input(
			z.object({
				appointmentId: z.string().cuid2(),
				hairOrderId: z.string().cuid2(),
			}),
		)
		.mutation(async ({ input }) => {
			const { appointmentId, hairOrderId } = input;

			const c = await prisma.hairAssignedToAppointment.create({
				data: {
					appointmentId,
					hairOrderId,
				},
			});
			return c;
		}),
	updateHairAssignment: protectedProcedure
		.input(
			z.object({
				hairAssignment: hairAssignedToAppointmentSchema,
			}),
		)
		.mutation(async ({ input }) => {
			const { hairAssignment } = input;

			const hairAssignmentSaved =
				await prisma.hairAssignedToAppointment.findUnique({
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

			const hairAssignmentUpdated =
				await prisma.hairAssignedToAppointment.update({
					data: {
						weightInGrams: hairAssignment.weightInGrams,
						total,
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
					},
				});

			const totalWeightInGramsForSale =
				await prisma.hairAssignedToSale.aggregate({
					where: { hairOrderId: hairAssignment.hairOrderId },
					_sum: {
						weightInGrams: true,
					},
				});

			const totalWeightInGrams =
				(totalWeightInGramsForSale._sum.weightInGrams ?? 0) +
				(totalWeightInGramsForAppointment._sum.weightInGrams ?? 0);

			await prisma.hairOrder.update({
				where: { id: hairAssignment.hairOrderId },
				data: { weightUsed: totalWeightInGrams },
			});

			return hairAssignmentUpdated;
		}),
	getHairAssignments: protectedProcedure
		.input(z.object({ appointmentId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { appointmentId } = input;

			const hairAssignments = await prisma.hairAssignedToAppointment.findMany({
				where: { appointmentId },
				include: { hairOrder: true },
			});

			return hairAssignments.map((a) => ({
				...a,
				soldFor: a.soldFor / 100,
				profit: a.profit / 100,
				total: a.total / 100,
				pricePerGram: a.hairOrder.pricePerGram / 100,
			}));
		}),
	getHairAssignmentById: protectedProcedure
		.input(z.object({ hairAssignmentId: z.string().cuid2().nullable() }))
		.query(async ({ input }) => {
			const { hairAssignmentId } = input;

			if (!hairAssignmentId) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			const hairAssignment = await prisma.hairAssignedToAppointment.findFirst({
				where: { id: hairAssignmentId },
				include: { hairOrder: true },
			});

			if (!hairAssignment) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return {
				...hairAssignment,
				soldFor: hairAssignment.soldFor / 100,
				profit: hairAssignment.profit / 100,
				total: hairAssignment.total / 100,
				pricePerGram: hairAssignment.hairOrder.pricePerGram / 100,
			};
		}),
	deleteHairAssignment: protectedProcedure
		.input(z.object({ hairAssignmentId: z.string().cuid2() }))
		.mutation(async ({ input }) => {
			const { hairAssignmentId } = input;

			const hairAssignment = await prisma.hairAssignedToAppointment.delete({
				where: { id: hairAssignmentId },
			});

			const totalWeightInGrams =
				await prisma.hairAssignedToAppointment.aggregate({
					where: { hairOrderId: hairAssignment.hairOrderId },
					_sum: {
						weightInGrams: true,
					},
				});

			await prisma.hairOrder.update({
				where: { id: hairAssignment.hairOrderId },
				data: { weightUsed: totalWeightInGrams._sum.weightInGrams ?? 0 },
			});

			return hairAssignment;
		}),
});
