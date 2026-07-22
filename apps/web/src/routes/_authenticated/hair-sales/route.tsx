import { createFileRoute } from "@tanstack/react-router"

import { HairSalesLayout } from "./-route-page"

export const Route = createFileRoute("/_authenticated/hair-sales")({
  component: HairSalesLayout,
})
