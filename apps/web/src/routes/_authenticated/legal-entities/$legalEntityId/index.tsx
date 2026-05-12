import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/legal-entities/$legalEntityId/overview",
      params,
    })
  },
})
