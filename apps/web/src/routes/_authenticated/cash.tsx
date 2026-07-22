import { createFileRoute } from "@tanstack/react-router"

import { CashPage } from "./-cash-page"

export const Route = createFileRoute("/_authenticated/cash")({
  component: CashPage,
})
