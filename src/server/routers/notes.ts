import prisma from "@/lib/prisma";
import { noteSchema, noteSchemaApi } from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { z } from "zod";

dayjs.extend(isoWeek);

export const notesRouter = createTRPCRouter({
	getById: protectedProcedure
		.input(z.object({ id: z.string().cuid2().nullable() }))
		.query(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Missing id" });
			}

			const note = await prisma.note.findUnique({
				where: { id },
			});

			if (!note) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return note;
		}),
	getBy: protectedProcedure
		.input(
			z.object({
				appointmentId: z.string().cuid2().nullish(),
				customerId: z.union([z.string().cuid2(), z.undefined()]),
				createdById: z.union([z.string().cuid2(), z.undefined()]),
				hairOrderId: z.string().cuid2().nullish(),
			}),
		)
		.query(async ({ input }) => {
			const { appointmentId, customerId, createdById, hairOrderId } = input;

			const notes = await prisma.note.findMany({
				where: { appointmentId, customerId, createdById, hairOrderId },
				include: { createdBy: true },
			});

			return notes;
		}),
	create: protectedProcedure
		.input(
			z.object({
				note: noteSchemaApi,
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { note } = input;

			const createdNote = await prisma.note.create({
				data: {
					...note,
					createdById: ctx.session.user.id,
				},
			});
			return createdNote;
		}),
	update: protectedProcedure
		.input(
			z.object({
				note: noteSchema,
			}),
		)
		.mutation(async ({ input }) => {
			const { note } = input;

			const noteSaved = await prisma.note.update({
				data: {
					...note,
				},
				where: { id: note.id },
			});

			return noteSaved;
		}),
	delete: protectedProcedure
		.input(
			z.object({
				id: z.string().cuid2().nullable(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id } = input;

			if (!id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Missing id",
				});
			}

			const note = await prisma.note.delete({
				where: { id },
			});

			if (!note) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Missing id",
				});
			}

			return note;
		}),
});
