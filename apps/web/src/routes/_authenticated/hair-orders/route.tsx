import { createFileRoute } from "@tanstack/react-router"

import { HairOrdersLayout } from "./-route-page"

export const Route = createFileRoute("/_authenticated/hair-orders")({
  component: HairOrdersLayout,
})
