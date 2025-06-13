import { auth } from "@/lib/auth";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const authRouter = createTRPCRouter({
	getBackupCodes: protectedProcedure.query(async ({ ctx }) => {
		return await auth.api.viewBackupCodes({
			body: { userId: ctx.session.session.userId },
		});
	}),
});
