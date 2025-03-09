import { z } from "zod";
import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { hairOrderNoteSchema } from "@/lib/schemas";

export const hairOrderNotesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        hairOrderId: z.string().cuid2(),
        note: hairOrderNoteSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { hairOrderId, note } = input;
      const { user } = ctx;

      const c = await prisma.hairOrderNote.create({
        data: {
          ...note,
          hairOrderId,
          createdById: user.id,
        },
      });
      return c;
    }),
  update: protectedProcedure
    .input(z.object({ note: hairOrderNoteSchema }))
    .mutation(async ({ input }) => {
      const { note } = input;

      const c = await prisma.hairOrderNote.update({
        data: {
          note: note.note,
        },
        where: {
          id: note.id,
        },
      });
      return c;
    }),
  delete: protectedProcedure
    .input(z.object({ noteId: z.string().cuid2() }))
    .mutation(async ({ input }) => {
      const { noteId } = input;

      const c = await prisma.hairOrderNote.delete({
        where: {
          id: noteId,
        },
      });
      return c;
    }),
  getNotesByHairOrderId: protectedProcedure
    .input(z.object({ hairOrderId: z.string().cuid2() }))
    .query(async ({ input }) => {
      const { hairOrderId } = input;

      const notes = await prisma.hairOrderNote.findMany({
        where: {
          hairOrderId,
        },
        include: { createdBy: true },
      });

      return notes;
    }),
});
