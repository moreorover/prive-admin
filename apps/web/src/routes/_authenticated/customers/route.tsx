import { createFileRoute } from "@tanstack/react-router"

import { CustomersLayout } from "./-route-page"

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersLayout,
})
