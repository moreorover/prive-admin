import prisma from "@/lib/prisma";
import { appointmentNoteSchema } from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";

export const appointmentNotesRouter = createTRPCRouter({
	create: protectedProcedure
		.input(
			z.object({
				appointmentId: z.string().cuid2(),
				note: appointmentNoteSchema,
			}),
		)
		.mutation(async ({ input }) => {
			const { appointmentId, note } = input;

			const c = await prisma.appointmentNote.create({
				data: {
					...note,
					appointmentId,
				},
			});
			return c;
		}),
	update: protectedProcedure
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
	delete: protectedProcedure
		.input(z.object({ noteId: z.string().cuid2() }))
		.mutation(async ({ input }) => {
			const { noteId } = input;

			const c = await prisma.appointmentNote.delete({
				where: {
					id: noteId,
				},
			});
			return c;
		}),
	getNotesByAppointmentId: protectedProcedure
		.input(z.object({ appointmentId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { appointmentId } = input;

			const notes = await prisma.appointmentNote.findMany({
				where: {
					appointmentId,
				},
			});

			return notes;
		}),
});
