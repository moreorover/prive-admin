import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { appointmentNoteSchema, appointmentSchema } from "@/lib/schemas";

dayjs.extend(isoWeek);

export const appointmentsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ input }) => {
      const { id } = input;

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
});
