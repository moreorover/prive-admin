import { notifications } from "@mantine/notifications"
import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

type QueryInvalidation = { queryKey: QueryKey }

export function useCreateAppointmentAction({
  invalidateKeys = [],
  onCreated,
}: {
  invalidateKeys?: QueryInvalidation[]
  onCreated?: (created: { id?: string } | null | undefined) => void
}) {
  const queryClient = useQueryClient()
  const defaultAppointmentsListQueryOptions = trpc.appointments.list.queryOptions({ page: 1, pageSize: 100 })

  return useMutation({
    ...trpc.appointments.create.mutationOptions(),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: defaultAppointmentsListQueryOptions.queryKey })
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      notifications.show({ color: "green", message: "Appointment created" })
      onCreated?.(created)
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
}

export function useAppointmentPersonnelActions({
  appointmentId,
  onMasterUpdated,
  onPersonnelLinked,
}: {
  appointmentId: string
  onMasterUpdated?: () => void
  onPersonnelLinked?: () => void
}) {
  const queryClient = useQueryClient()
  const appointmentQueryKey = trpc.appointments.get.queryOptions({ id: appointmentId }).queryKey

  const updateMaster = useMutation({
    ...trpc.appointments.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentQueryKey })
      notifications.show({ color: "green", message: "Master updated." })
      onMasterUpdated?.()
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const linkPersonnel = useMutation({
    ...trpc.appointments.linkPersonnel.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentQueryKey })
      notifications.show({ color: "green", message: "Personnel picked." })
      onPersonnelLinked?.()
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return { updateMaster, linkPersonnel }
}
