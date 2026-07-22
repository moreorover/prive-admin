import { createFileRoute } from "@tanstack/react-router"

import { HairOrdersPage } from "./-index-page"

export const Route = createFileRoute("/_authenticated/hair-orders/")({
  component: HairOrdersPage,
})
