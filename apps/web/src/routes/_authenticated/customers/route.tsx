import { createFileRoute } from "@tanstack/react-router"

import { CustomersLayout } from "./-components/route-page"

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersLayout,
})
