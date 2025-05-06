import { getSession } from "@/lib/auth";
import { TRPCError, initTRPC } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";

export const createTRPCContext = cache(async () => {
	// const session = await auth.api.getSession({
	// 	headers: await headers(),
	// });
	const session = await getSession();

	return { user: session?.user };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
	/**
	 * @see https://trpc.io/docs/server/data-transformers
	 */
	transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(
	async function isAuthed(opts) {
		const { ctx } = opts;

		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}

		return opts.next({
			ctx: {
				...ctx,
				user: ctx.user,
			},
		});
	},
);
