import { createFileRoute } from "@tanstack/react-router"

import { SalonEdit } from "./-components/salon-id-page"

export const Route = createFileRoute("/_authenticated/salons/$salonId")({
  component: SalonEdit,
})
