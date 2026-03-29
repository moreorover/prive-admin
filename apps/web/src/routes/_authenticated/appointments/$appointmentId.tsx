import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import { useQuery, queryOptions } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, Clock, Plus, User } from "lucide-react"
import { useState } from "react"

import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { getAppointment } from "@/functions/appointments"
import { getHairAssignedByAppointment } from "@/functions/hair-assigned"
import { appointmentKeys, hairAssignedKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/appointments/$appointmentId")({
  component: AppointmentDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: appointmentKeys.detail(params.appointmentId),
          queryFn: () => getAppointment({ data: { id: params.appointmentId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: hairAssignedKeys.byAppointment(params.appointmentId),
          queryFn: () => getHairAssignedByAppointment({ data: { appointmentId: params.appointmentId } }),
        }),
      ),
    ])
  },
})

function AppointmentDetailPage() {
  const { appointmentId } = Route.useParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)

  const { data: appointment, isLoading } = useQuery({
    queryKey: appointmentKeys.detail(appointmentId),
    queryFn: () => getAppointment({ data: { id: appointmentId } }),
  })

  const { data: hairAssigned } = useQuery({
    queryKey: hairAssignedKeys.byAppointment(appointmentId),
    queryFn: () => getHairAssignedByAppointment({ data: { appointmentId } }),
  })

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!appointment) {
    return <div className="px-6 py-8 text-muted-foreground">Appointment not found.</div>
  }

  const invalidateKeys = [
    { queryKey: appointmentKeys.detail(appointmentId) },
    { queryKey: hairAssignedKeys.byAppointment(appointmentId) },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="space-y-1">
        <Link
          to="/appointments"
          className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back to appointments
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{appointment.name}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {new Date(appointment.startsAt).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <User className="size-3" />
            <Link
              to="/customers/$customerId"
              params={{ customerId: appointment.client.id }}
              className="text-primary hover:underline"
            >
              {appointment.client.name}
            </Link>
          </span>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Personnel</CardTitle>
          </CardHeader>
          <CardContent>
            {appointment.personnel && appointment.personnel.length > 0 ? (
              <div className="space-y-2">
                {appointment.personnel.map((p) => (
                  <div key={p.personnelId} className="flex items-center gap-2 rounded-md border p-2">
                    <User className="size-3 text-muted-foreground" />
                    <span className="text-sm">{p.personnel.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No personnel assigned.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Hair Assigned</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            <HairAssignedTable
              items={hairAssigned ?? []}
              showHairOrderColumn
              onEdit={setEditItem}
              onDelete={setDeleteItem}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {appointment.notes && appointment.notes.length > 0 ? (
              <div className="space-y-3">
                {appointment.notes.map((n) => (
                  <div key={n.id} className="rounded-md border p-3">
                    <p className="text-sm">{n.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.createdBy?.name ?? "Unknown"} &middot; {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateHairAssignedDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clientId={appointment.client.id}
        appointmentId={appointmentId}
        invalidateKeys={invalidateKeys}
      />

      {editItem && (
        <EditHairAssignedDialog
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          hairAssigned={editItem}
          invalidateKeys={invalidateKeys}
        />
      )}

      {deleteItem && (
        <DeleteHairAssignedDialog
          open={!!deleteItem}
          onOpenChange={(open) => !open && setDeleteItem(null)}
          hairAssigned={deleteItem}
          invalidateKeys={invalidateKeys}
        />
      )}
    </div>
  )
}
