import { createFileRoute } from "@tanstack/react-router"

import { HairSalesLayout } from "./-components/route-page"

export const Route = createFileRoute("/_authenticated/hair-sales")({
  component: HairSalesLayout,
})
