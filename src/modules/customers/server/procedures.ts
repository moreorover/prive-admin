import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { customerSchema } from "@/lib/schemas";

export const customersRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return prisma.customer.findMany();
  }),
  create: protectedProcedure
    .input(z.object({ customer: customerSchema }))
    .mutation(async ({ input, ctx }) => {
      const { customer } = input;

      const c = await prisma.customer.create({
        data: { name: customer.name },
      });

      return c;
    }),
  update: protectedProcedure
    .input(z.object({ customer: customerSchema }))
    .mutation(async ({ input, ctx }) => {
      const { customer } = input;

      const c = await prisma.customer.update({
        data: { name: customer.name },
        where: { id: customer.id },
      });

      return c;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

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
    .query(async ({ input, ctx }) => {
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
    .query(async ({ input, ctx }) => {
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
    .query(async ({ input, ctx }) => {
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
});
