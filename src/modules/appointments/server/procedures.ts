import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { appointmentSchema } from "@/lib/schemas";

export const appointmentsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return appointment;
    }),
  update: protectedProcedure
    .input(z.object({ appointment: appointmentSchema }))
    .mutation(async ({ input, ctx }) => {
      const { appointment } = input;

      const c = await prisma.appointment.update({
        data: {
          name: appointment.name,
          notes: appointment.notes,
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
    .mutation(async ({ input, ctx }) => {
      const { personnel, appointmentId } = input;

      const data = personnel.map((p) => ({
        appointmentId,
        personnelId: p,
      }));

      const c = await prisma.personnelOnAppointments.createMany({ data });

      return c;
    }),
});
