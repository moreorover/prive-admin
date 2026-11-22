import { createFileRoute } from "@tanstack/react-router"

import { useSalonActions } from "./-actions/salon-actions"
import { SalonCreate } from "./-components/salon-id-page"

export const Route = createFileRoute("/_authenticated/salons/new")({ component: RouteComponent })

function RouteComponent() {
  const navigate = Route.useNavigate()
  const { create } = useSalonActions({ onSaved: () => navigate({ to: "/salons" }) })

  return <SalonCreate createPending={create.isPending} onCreate={(values) => create.mutate(values)} />
}
