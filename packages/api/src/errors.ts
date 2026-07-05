import { ApplicationError } from "@prive-admin-tanstack/application/errors"
import { TRPCError } from "@trpc/server"

export function toTrpcError(error: unknown) {
  if (error instanceof ApplicationError) {
    return new TRPCError({
      code:
        error.code === "BAD_REQUEST"
          ? "BAD_REQUEST"
          : error.code === "CONFLICT"
            ? "CONFLICT"
            : error.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : "INTERNAL_SERVER_ERROR",
      message: error.message,
    })
  }

  return error
}
