export type ApplicationErrorCode = "BAD_REQUEST" | "CONFLICT" | "INTERNAL_SERVER_ERROR" | "NOT_FOUND"

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = "ApplicationError"
  }
}

export const badRequest = (message: string, options?: { cause?: unknown }) =>
  new ApplicationError("BAD_REQUEST", message, options)

export const conflict = (message: string, options?: { cause?: unknown }) =>
  new ApplicationError("CONFLICT", message, options)

export const internalServerError = (message: string, options?: { cause?: unknown }) =>
  new ApplicationError("INTERNAL_SERVER_ERROR", message, options)

export const notFound = (message: string, options?: { cause?: unknown }) =>
  new ApplicationError("NOT_FOUND", message, options)
