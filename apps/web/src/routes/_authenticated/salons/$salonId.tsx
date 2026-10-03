import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { useSalonActions } from "./-actions/salon-actions"
import { SalonEdit } from "./-components/salon-id-page"
import { salonQueryOptions } from "./-data/salon-data"

export const Route = createFileRoute("/_authenticated/salons/$salonId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    if (params.salonId !== "new") {
      await context.queryClient.ensureQueryData(salonQueryOptions(params.salonId))
    }
  },
})

function RouteComponent() {
  const { salonId } = Route.useParams()
  const isNew = salonId === "new"
  const navigate = Route.useNavigate()
  const salon = useQuery({ ...salonQueryOptions(salonId), enabled: !isNew }).data
  const { create, update } = useSalonActions({ salonId, onSaved: () => navigate({ to: "/salons" }) })

  return (
    <SalonEdit
      salonId={salonId}
      salon={salon}
      createPending={create.isPending}
      updatePending={update.isPending}
      onCreate={(values) => create.mutate(values)}
      onUpdate={(values) => update.mutate({ ...values, id: salonId })}
    />
  )
}
