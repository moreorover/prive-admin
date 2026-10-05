import { createFileRoute, redirect } from "@tanstack/react-router"

import { authClient } from "@/lib/auth-client"

import { TwoFactorPage } from "./-components/two-factor-page"

export const Route = createFileRoute("/two-factor")({
  component: TwoFactorPage,
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (session.error) throw new Error(session.error.message || "Failed to load session")
    if (session.data) throw redirect({ to: "/customers" })
  },
})
