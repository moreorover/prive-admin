import { auth } from "@prive-admin-tanstack/auth"

export async function requireSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return null
  return session
}
