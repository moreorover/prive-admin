import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"

import { authClient } from "@/lib/auth-client"

import { RouteComponent } from "./-login-page"

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (session.error) {
      throw new Error(session.error.message || "Failed to load session")
    }
    if (session.data) {
      throw redirect({ to: "/customers" })
    }
  },
})
