import { auth } from "@prive-admin-tanstack/auth"
import { createMiddleware } from "@tanstack/react-start"

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  return next({
    context: { session },
  })
})

export const requireAuthMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session) {
      throw new Error("Unauthorized")
    }
    return next({ context: { session: context.session } })
  })
