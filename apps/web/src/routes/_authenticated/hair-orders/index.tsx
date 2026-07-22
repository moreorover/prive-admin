import { createFileRoute } from "@tanstack/react-router"

import { HairOrdersPage } from "./-components/index-page"

export const Route = createFileRoute("/_authenticated/hair-orders/")({
  component: HairOrdersPage,
})
