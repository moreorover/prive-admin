import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

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
});
