import { Button, Group, Modal, Select, Stack, TextInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import dayjs from "dayjs"

import { trpc } from "@/utils/trpc"

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
  masterId: string
  salonId: string
}

type SalonOption = {
  id: string
  name: string
}

const defaultStartsAtString = () => dayjs().startOf("hour").add(1, "hour").format("YYYY-MM-DD HH:mm:ss")
const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }
const defaultAppointmentsListInput = { page: 1, pageSize: 100 }

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  defaultClientId,
  defaultStartsAt,
  invalidateKeys,
  navigateOnSuccess,
}: CreateAppointmentDialogProps) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Appointment">
      {open && (
        <CreateAppointmentForm
          defaultClientId={defaultClientId}
          defaultStartsAt={defaultStartsAt}
          invalidateKeys={invalidateKeys}
          navigateOnSuccess={navigateOnSuccess}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Modal>
  )
}

function CreateAppointmentForm({
  defaultClientId,
  defaultStartsAt,
  invalidateKeys,
  navigateOnSuccess,
  onClose,
}: Omit<CreateAppointmentDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const appointmentListQueryOptions = trpc.appointments.list.queryOptions(defaultAppointmentsListInput)
  const salonsQueryOptions = trpc.salons.list.queryOptions()

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      startsAt: defaultStartsAt ?? defaultStartsAtString(),
      clientId: defaultClientId ?? "",
      masterId: "",
      salonId: "",
    },
    validate: {
      name: (v) => (v.trim() ? null : "Name is required"),
      startsAt: (v) => (v ? null : "Start time is required"),
      clientId: (v) => (v ? null : "Client is required"),
      masterId: (v) => (v ? null : "Master is required"),
      salonId: (v) => (v ? null : "Salon is required"),
    },
  })

  const { data: customersData } = useQuery(trpc.customers.list.queryOptions(defaultCustomersListInput))
  const customers = customersData?.items ?? []

  const { data: salons } = useQuery(salonsQueryOptions)

  const mutation = useMutation({
    ...trpc.appointments.create.mutationOptions(),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: appointmentListQueryOptions.queryKey })
      for (const key of invalidateKeys ?? []) queryClient.invalidateQueries(key)
      notifications.show({ color: "green", message: "Appointment created" })
      onClose()
      if (navigateOnSuccess && created?.id) {
        navigate({ to: "/appointments/$appointmentId", params: { appointmentId: created.id } })
      }
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const handleSubmit = (values: FormValues) =>
    mutation.mutate({
      name: values.name.trim(),
      startsAt: dayjs(values.startsAt!).toISOString(),
      clientId: values.clientId,
      masterId: values.masterId,
      salonId: values.salonId,
    })

  return (
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
            data={customers.map((c) => ({ value: c.id, label: c.name }))}
            {...form.getInputProps("clientId")}
          />
        )}
        <Select
          label="Master"
          required
          searchable
          data={customers.map((c) => ({ value: c.id, label: c.name }))}
          {...form.getInputProps("masterId")}
        />
        <Select
          label="Salon"
          required
          data={(salons ?? []).map((s: SalonOption) => ({ value: s.id, label: s.name }))}
          {...form.getInputProps("salonId")}
        />
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Create
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
