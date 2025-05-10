import prisma from "@/lib/prisma";
import { appointmentNoteSchema } from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
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
		.input(z.object({ id: z.string().cuid2().nullable() }))
		.mutation(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Missing id" });
			}

			const note = await prisma.appointmentNote.delete({
				where: {
					id,
				},
			});

			if (!note) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return note;
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
	getNotesByCustomerId: protectedProcedure
		.input(z.object({ customerId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { customerId } = input;

			const notes = await prisma.appointmentNote.findMany({
				where: {
					appointment: {
						clientId: customerId,
					},
				},
				include: { appointment: true },
				orderBy: {
					createdAt: "desc",
				},
			});

			return notes;
		}),
	getById: protectedProcedure
		.input(z.object({ id: z.string().cuid2().nullable() }))
		.query(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Missing id" });
			}

			const note = await prisma.appointmentNote.findFirst({
				where: {
					id,
				},
			});

			if (!note) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return note;
		}),
});
