import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/customers/$customerId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/customers/$customerId/appointments",
      params,
    })
  },
})
