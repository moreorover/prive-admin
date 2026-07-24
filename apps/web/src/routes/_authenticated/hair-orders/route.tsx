import { createFileRoute } from "@tanstack/react-router"

import { HairOrdersLayout } from "./-components/route-page"

export const Route = createFileRoute("/_authenticated/hair-orders")({
  component: HairOrdersLayout,
})
