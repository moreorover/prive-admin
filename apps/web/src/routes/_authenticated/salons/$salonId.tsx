import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { useSalonActions } from "./-actions/salon-actions"
import { SalonEdit } from "./-components/salon-id-page"
import { salonQueryOptions } from "./-data/salon-data"

export const Route = createFileRoute("/_authenticated/salons/$salonId")({
  component: RouteComponent,
  loader: async ({ context, params }) => context.queryClient.ensureQueryData(salonQueryOptions(params.salonId)),
})

function RouteComponent() {
  const { salonId } = Route.useParams()
  const navigate = Route.useNavigate()
  const salon = useQuery(salonQueryOptions(salonId)).data
  const { update } = useSalonActions({ onSaved: () => navigate({ to: "/salons" }) })

  return (
    <SalonEdit
      salonId={salonId}
      salon={salon}
      updatePending={update.isPending}
      onUpdate={(values) => update.mutate({ ...values, id: salonId })}
    />
  )
}
