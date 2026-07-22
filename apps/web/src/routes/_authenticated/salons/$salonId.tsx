import { createFileRoute } from "@tanstack/react-router"

import { SalonEdit } from "./-$salonId-page"

export const Route = createFileRoute("/_authenticated/salons/$salonId")({
  component: SalonEdit,
})
