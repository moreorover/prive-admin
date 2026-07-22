import { createFileRoute } from "@tanstack/react-router"

import { AppointmentsLayout } from "./-route-page"

export const Route = createFileRoute("/_authenticated/appointments")({
  component: AppointmentsLayout,
})
