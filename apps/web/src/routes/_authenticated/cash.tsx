import { createFileRoute } from "@tanstack/react-router"

import { CashPage } from "./-components/cash-page"

export const Route = createFileRoute("/_authenticated/cash")({
  component: CashPage,
})
