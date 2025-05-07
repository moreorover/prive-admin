import prisma from "@/lib/prisma";
import { hairOrderNoteSchema } from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

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
		.input(z.object({ id: z.string().cuid2().nullable() }))
		.mutation(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Missing id" });
			}

			const note = await prisma.hairOrderNote.delete({
				where: {
					id,
				},
			});

			if (!note) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return note;
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
	getById: protectedProcedure
		.input(z.object({ id: z.string().cuid2().nullable() }))
		.query(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Missing id" });
			}

			const note = await prisma.hairOrderNote.findFirst({
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
