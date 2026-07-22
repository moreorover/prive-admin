import { createFileRoute } from "@tanstack/react-router"

import { AppointmentsLayout } from "./-components/route-page"

export const Route = createFileRoute("/_authenticated/appointments")({
  component: AppointmentsLayout,
})
