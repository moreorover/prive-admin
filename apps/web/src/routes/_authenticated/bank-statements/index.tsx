import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/bank-statements/")({
  beforeLoad: () => {
    throw redirect({ to: "/legal-entities" })
  },
})
