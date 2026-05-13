import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/salons/")({
  beforeLoad: () => {
    throw redirect({ to: "/legal-entities" })
  },
})
