import { createFileRoute, redirect } from "@tanstack/react-router"

import { authClient } from "@/lib/auth-client"

import { AuthenticatedErrorComponent, AuthenticatedLayout } from "./-components/route-page"

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  errorComponent: AuthenticatedErrorComponent,
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession()
    if (session.error) {
      throw new Error(session.error.message || "Failed to load session")
    }
    if (!session.data) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
    return { session: session.data }
  },
})
