import prisma from "@/lib/prisma";
import {appointmentSchema} from "@/lib/schemas";
import {createTRPCRouter, protectedProcedure} from "@/server/trpc";
import {TRPCError} from "@trpc/server";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import {z} from "zod";

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
				include: { client: true, master: true },
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
					masterId: appointment.masterId,
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
	getAppointmentsBetweenDates: protectedProcedure
		.input(z.object({ startDate: z.date(), endDate: z.date() }))
		.query(async ({ input, ctx }) => {
			const { startDate, endDate } = input;

			const role = ctx.session.user.role;

			const masterId = role === "admin" ? undefined : ctx.session.user.id;

			const appointments = await prisma.appointment.findMany({
				where: {
					startsAt: {
						gte: startDate,
						lte: endDate,
					},
					masterId
				},
				orderBy: {
					startsAt: "asc",
				},
				include: {
					client: true,
					master: true
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
	getMasterOptions: protectedProcedure
		.query(async () => {

			const users = await prisma.user.findMany({
				select: {name: true, id: true },
			});

			return users.map(user => ({label: user.name, value: user.id }));
		}),
});
