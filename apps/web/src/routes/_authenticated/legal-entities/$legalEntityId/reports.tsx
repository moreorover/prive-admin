import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/reports")({
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: "/legal-entities/$legalEntityId/overview",
      params,
      search,
    })
  },
})
