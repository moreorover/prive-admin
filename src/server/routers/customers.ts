import prisma from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { customerSchema } from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const customersRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async () => {
		return prisma.customer.findMany();
	}),
	create: protectedProcedure
		.input(z.object({ customer: customerSchema }))
		.mutation(async ({ input }) => {
			const { customer } = input;

			const c = await prisma.customer.create({
				data: { name: customer.name, phoneNumber: customer.phoneNumber },
			});

			return c;
		}),
	update: protectedProcedure
		.input(z.object({ customer: customerSchema }))
		.mutation(async ({ input }) => {
			const { customer } = input;

			const c = await prisma.customer.update({
				data: { name: customer.name, phoneNumber: customer.phoneNumber },
				where: { id: customer.id },
			});

			return c;
		}),
	getById: protectedProcedure
		.input(z.object({ id: z.string().cuid2().nullable() }))
		.query(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Missing id" });
			}

			const customer = await prisma.customer.findUnique({
				where: { id },
			});

			if (!customer) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return customer;
		}),
	getClientByAppointmentId: protectedProcedure
		.input(z.object({ appointmentId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { appointmentId } = input;

			const appointment = await prisma.appointment.findUnique({
				where: { id: appointmentId },
				select: { client: true },
			});

			if (!appointment) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return appointment.client;
		}),
	getPersonnelByAppointmentId: protectedProcedure
		.input(z.object({ appointmentId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { appointmentId } = input;

			const appointment = await prisma.appointment.findUnique({
				where: { id: appointmentId },
				include: {
					personnel: {
						include: {
							personnel: true, // This includes the Customer (Personnel)
						},
					},
				},
			});

			if (!appointment) {
				throw new Error("Appointment not found");
			}

			return appointment.personnel.map((p) => p.personnel);
		}),
	getAvailablePersonnelByAppointmentId: protectedProcedure
		.input(z.object({ appointmentId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { appointmentId } = input;

			const appointment = await prisma.appointment.findUnique({
				where: { id: appointmentId },
				select: { clientId: true },
			});

			if (!appointment) {
				throw new Error("Appointment not found");
			}

			// Fetch available personnel directly using Prisma
			return prisma.customer.findMany({
				where: {
					AND: [
						{
							id: { not: appointment.clientId }, // Exclude the client
						},
						{
							appointmentsAsPersonnel: {
								none: {
									appointmentId: appointmentId, // Exclude personnel already assigned to this appointment
								},
							},
						},
					],
				},
			});
		}),
	getViewById: protectedProcedure
		.input(z.object({ id: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { id } = input;

			const customer = await prisma.customer.findUnique({
				where: { id },
				select: {
					createdAt: true,
					appointmentsAsCustomer: {
						select: {
							id: true,
							transactions: {
								select: {
									amount: true,
								},
							},
						},
					},
					transactions: {
						select: {
							amount: true,
						},
					},
					hairAssigned: {
						select: {
							profit: true,
							soldFor: true,
							weightInGrams: true,
						},
					},
					notes: true,
				},
			});

			if (!customer) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			const appointmentCount = customer.appointmentsAsCustomer.length;
			const transactionSum = customer.transactions.reduce(
				(acc, txn) => acc + txn.amount,
				0,
			);
			const hairAssignedProfitSum = customer.hairAssigned.reduce(
				(acc, ha) => acc + ha.profit,
				0,
			);
			const hairAssignedSoldForSum = customer.hairAssigned.reduce(
				(acc, ha) => acc + ha.soldFor,
				0,
			);
			const hairAssignedWeightInGramsSum = customer.hairAssigned.reduce(
				(acc, ha) => acc + ha.weightInGrams,
				0,
			);
			const noteCount = customer.notes.length;
			const customerCreatedAt = customer.createdAt;

			return {
				appointmentCount,
				transactionSum: transactionSum / 100,
				hairAssignedProfitSum: hairAssignedProfitSum / 100,
				hairAssignedSoldForSum: hairAssignedSoldForSum / 100,
				hairAssignedWeightInGramsSum,
				noteCount,
				customerCreatedAt,
			};
		}),
});
