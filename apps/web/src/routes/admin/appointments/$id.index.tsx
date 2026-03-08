import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { format } from "date-fns"
import { PencilIcon } from "lucide-react"

import { EntityHistory } from "@/components/entity-history"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/admin/appointments/$id/")({
  staticData: { title: "View Appointment" },
  component: ViewAppointmentPage,
})

const statusStyles: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  no_show: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
}

function formatDuration(startsAt: string, endsAt: string | null): string {
  if (!endsAt) return "—"
  const diffMs = new Date(endsAt).getTime() - new Date(startsAt).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{children}</dd>
    </div>
  )
}

function ViewAppointmentPage() {
  const { id } = Route.useParams()

  const appointmentQuery = useQuery(trpc.appointment.getById.queryOptions({ id }))

  if (appointmentQuery.isLoading) {
    return <div className="text-center text-muted-foreground">Loading...</div>
  }

  if (!appointmentQuery.data) {
    return <div className="text-center text-muted-foreground">Appointment not found.</div>
  }

  const appt = appointmentQuery.data

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{appt.name}</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/appointments/$id/edit" params={{ id }}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          <dl className="divide-y">
            <DetailRow label="Status">
              <Badge className={statusStyles[appt.status]} variant="outline">
                {statusLabels[appt.status] ?? appt.status}
              </Badge>
            </DetailRow>

            <DetailRow label="Customer">
              {appt.customerName ?? "—"}
            </DetailRow>

            <DetailRow label="Date">
              {format(new Date(appt.startsAt), "EEEE, dd MMMM yyyy")}
            </DetailRow>

            <DetailRow label="Time">
              {format(new Date(appt.startsAt), "HH:mm")}
              {appt.endsAt ? ` – ${format(new Date(appt.endsAt), "HH:mm")}` : ""}
            </DetailRow>

            <DetailRow label="Duration">
              {formatDuration(appt.startsAt, appt.endsAt)}
            </DetailRow>

            {appt.notes && (
              <DetailRow label="Notes">
                <p className="whitespace-pre-wrap">{appt.notes}</p>
              </DetailRow>
            )}

            <DetailRow label="Created by">
              {appt.createdByName ?? "—"}
            </DetailRow>

            <DetailRow label="Created at">
              {format(new Date(appt.createdAt), "dd MMM yyyy, HH:mm")}
            </DetailRow>

            <DetailRow label="Last updated">
              {format(new Date(appt.updatedAt), "dd MMM yyyy, HH:mm")}
            </DetailRow>
          </dl>
        </CardContent>
      </Card>

      <EntityHistory entityType="appointment" entityId={id} />
    </div>
  )
}
