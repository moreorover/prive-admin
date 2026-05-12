import { Button, Group, Modal, Select, Stack, TextInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import dayjs from "dayjs"
import { useEffect } from "react"

import { createAppointment } from "@/functions/appointments"
import { getCustomers } from "@/functions/customers"
import { listSalons } from "@/functions/salons"
import { appointmentKeys, customerKeys, salonKeys } from "@/lib/query-keys"

type CreateAppointmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClientId?: string
  defaultStartsAt?: string | null
  invalidateKeys?: { queryKey: readonly unknown[] }[]
  navigateOnSuccess?: boolean
}

type FormValues = {
  name: string
  startsAt: string | null
  clientId: string
  salonId: string
}

const defaultStartsAtString = () => dayjs().startOf("hour").add(1, "hour").format("YYYY-MM-DD HH:mm:ss")

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  defaultClientId,
  defaultStartsAt,
  invalidateKeys,
  navigateOnSuccess,
}: CreateAppointmentDialogProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      startsAt: defaultStartsAt ?? defaultStartsAtString(),
      clientId: defaultClientId ?? "",
      salonId: "",
    },
    validate: {
      name: (v) => (v.trim() ? null : "Name is required"),
      startsAt: (v) => (v ? null : "Start time is required"),
      clientId: (v) => (v ? null : "Client is required"),
      salonId: (v) => (v ? null : "Salon is required"),
    },
  })

  useEffect(() => {
    if (open) {
      form.setValues({
        name: "",
        startsAt: defaultStartsAt ?? defaultStartsAtString(),
        clientId: defaultClientId ?? "",
        salonId: "",
      })
      form.resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultClientId, defaultStartsAt])

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
    enabled: open && !defaultClientId,
  })

  const { data: salons } = useQuery({
    queryKey: salonKeys.list(),
    queryFn: () => listSalons(),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createAppointment({
        data: {
          name: values.name.trim(),
          startsAt: dayjs(values.startsAt!).toISOString(),
          clientId: values.clientId,
          salonId: values.salonId,
        },
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      for (const key of invalidateKeys ?? []) queryClient.invalidateQueries(key)
      notifications.show({ color: "green", message: "Appointment created" })
      onOpenChange(false)
      if (navigateOnSuccess && created?.id) {
        navigate({ to: "/appointments/$appointmentId", params: { appointmentId: created.id } })
      }
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const handleSubmit = (values: FormValues) => mutation.mutate(values)

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Appointment">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" placeholder="Appointment name" required {...form.getInputProps("name")} />
          <DateTimePicker
            label="Starts at"
            required
            valueFormat="DD MMM YYYY HH:mm"
            {...form.getInputProps("startsAt")}
          />
          {!defaultClientId && (
            <Select
              label="Client"
              required
              searchable
              data={(customers ?? []).map((c) => ({ value: c.id, label: c.name }))}
              {...form.getInputProps("clientId")}
            />
          )}
          <Select
            label="Salon"
            required
            data={(salons ?? []).map((s) => ({ value: s.id, label: s.name }))}
            {...form.getInputProps("salonId")}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
