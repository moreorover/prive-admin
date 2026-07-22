import { Button, Group, Modal, Select, Stack, TextInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import dayjs from "dayjs"
import { useState } from "react"

import { type SelectOption, withPinnedOption } from "@/lib/resource-pagination"
import { trpc } from "@/utils/trpc"

type CreateAppointmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClientId?: string
  defaultStartsAt?: string | null
  invalidateKeys?: { queryKey: readonly unknown[] }[]
  navigateOnSuccess?: boolean
  clientOptions: SelectOption[]
  masterOptions: SelectOption[]
  salonOptions: SelectOption[]
  clientSearch: string
  masterSearch: string
  onClientSearchChange: (value: string) => void
  onMasterSearchChange: (value: string) => void
}

type FormValues = {
  name: string
  startsAt: string | null
  clientId: string
  masterId: string
  salonId: string
}

const defaultStartsAtString = () => dayjs().startOf("hour").add(1, "hour").format("YYYY-MM-DD HH:mm:ss")
const defaultAppointmentsListInput = { page: 1, pageSize: 100 }

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  defaultClientId,
  defaultStartsAt,
  invalidateKeys,
  navigateOnSuccess,
  clientOptions,
  masterOptions,
  salonOptions,
  clientSearch,
  masterSearch,
  onClientSearchChange,
  onMasterSearchChange,
}: CreateAppointmentDialogProps) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Appointment">
      {open && (
        <CreateAppointmentForm
          defaultClientId={defaultClientId}
          defaultStartsAt={defaultStartsAt}
          invalidateKeys={invalidateKeys}
          navigateOnSuccess={navigateOnSuccess}
          clientOptions={clientOptions}
          masterOptions={masterOptions}
          salonOptions={salonOptions}
          clientSearch={clientSearch}
          masterSearch={masterSearch}
          onClientSearchChange={onClientSearchChange}
          onMasterSearchChange={onMasterSearchChange}
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
  clientOptions: rawClientOptions,
  masterOptions: rawMasterOptions,
  salonOptions,
  clientSearch,
  masterSearch,
  onClientSearchChange,
  onMasterSearchChange,
  onClose,
}: Omit<CreateAppointmentDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const appointmentListQueryOptions = trpc.appointments.list.queryOptions(defaultAppointmentsListInput)
  const [selectedCustomerOptions, setSelectedCustomerOptions] = useState<Record<string, SelectOption>>({})

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

  const clientOptions = withPinnedOption(rawClientOptions, selectedCustomerOptions[form.values.clientId])
  const masterOptions = withPinnedOption(rawMasterOptions, selectedCustomerOptions[form.values.masterId])

  const rememberCustomerOption = (value: string | null, options: SelectOption[]) => {
    if (!value) return
    const option = options.find((candidate) => candidate.value === value)
    if (!option) return
    setSelectedCustomerOptions((current) => ({ ...current, [option.value]: option }))
  }

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
            searchValue={clientSearch}
            onSearchChange={onClientSearchChange}
            data={clientOptions}
            value={form.values.clientId}
            onChange={(value) => {
              form.setFieldValue("clientId", value ?? "")
              rememberCustomerOption(value, clientOptions)
            }}
            error={form.errors.clientId}
          />
        )}
        <Select
          label="Master"
          required
          searchable
          searchValue={masterSearch}
          onSearchChange={onMasterSearchChange}
          data={masterOptions}
          value={form.values.masterId}
          onChange={(value) => {
            form.setFieldValue("masterId", value ?? "")
            rememberCustomerOption(value, masterOptions)
          }}
          error={form.errors.masterId}
        />
        <Select label="Salon" required data={salonOptions} {...form.getInputProps("salonId")} />
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
