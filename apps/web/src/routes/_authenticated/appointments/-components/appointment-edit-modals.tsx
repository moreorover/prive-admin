import { Button, Group, Modal, Select, Stack, TextInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { useForm } from "@mantine/form"
import dayjs from "dayjs"
import { useEffect, useState } from "react"

import { type SelectOption, withPinnedOption } from "@/lib/resource-pagination"

import { getMasterCustomerQuerySearch } from "./appointment-master-search"

type EditAppointmentModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  currentStartsAt: string | Date
  loading: boolean
  onSubmit: (values: { name: string; startsAt: string }) => void
}

export function EditAppointmentModal({
  open,
  onOpenChange,
  currentName,
  currentStartsAt,
  loading,
  onSubmit,
}: EditAppointmentModalProps) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit appointment">
      {open && (
        <EditAppointmentForm
          currentName={currentName}
          currentStartsAt={currentStartsAt}
          loading={loading}
          onClose={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  )
}

type EditAppointmentFormValues = {
  name: string
  startsAt: string | null
}

export function EditAppointmentForm({
  currentName,
  currentStartsAt,
  loading,
  onClose,
  onSubmit,
}: {
  currentName: string
  currentStartsAt: string | Date
  loading: boolean
  onClose: () => void
  onSubmit: (values: { name: string; startsAt: string }) => void
}) {
  const initialStartsAt = dayjs(currentStartsAt).format("YYYY-MM-DD HH:mm:ss")
  const form = useForm<EditAppointmentFormValues>({
    initialValues: {
      name: currentName,
      startsAt: initialStartsAt,
    },
    validate: {
      name: (v) => (v.trim() ? null : "Title is required"),
      startsAt: (v) => (v ? null : "Start time is required"),
    },
  })
  const startsAtChanged = form.values.startsAt
    ? dayjs(form.values.startsAt).toISOString() !== dayjs(currentStartsAt).toISOString()
    : false
  const nameChanged = form.values.name.trim() !== currentName

  return (
    <form
      onSubmit={form.onSubmit((values) =>
        onSubmit({ name: values.name.trim(), startsAt: dayjs(values.startsAt!).toISOString() }),
      )}
    >
      <Stack>
        <TextInput label="Title" placeholder="Appointment title" required {...form.getInputProps("name")} />
        <DateTimePicker
          label="Starts at"
          required
          valueFormat="DD MMM YYYY HH:mm"
          {...form.getInputProps("startsAt")}
        />
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!form.values.name.trim() || (!nameChanged && !startsAtChanged)}
            loading={loading}
            type="submit"
          >
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

type ChangeMasterModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentMasterId: string
  masterOptions: SelectOption[]
  currentMasterOption: SelectOption
  loading: boolean
  onMasterSearchChange: (search: string) => void
  onSubmit: (values: { masterId: string }) => void
}

export function ChangeMasterModal({
  open,
  onOpenChange,
  currentMasterId,
  masterOptions,
  currentMasterOption,
  loading,
  onMasterSearchChange,
  onSubmit,
}: ChangeMasterModalProps) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Change master">
      {open && (
        <ChangeMasterForm
          currentMasterId={currentMasterId}
          masterOptions={masterOptions}
          currentMasterOption={currentMasterOption}
          loading={loading}
          onMasterSearchChange={onMasterSearchChange}
          onClose={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  )
}

function ChangeMasterForm({
  currentMasterId,
  masterOptions: rawMasterOptions,
  currentMasterOption,
  loading,
  onMasterSearchChange,
  onClose,
  onSubmit,
}: {
  currentMasterId: string
  masterOptions: SelectOption[]
  currentMasterOption: SelectOption
  loading: boolean
  onMasterSearchChange: (search: string) => void
  onClose: () => void
  onSubmit: (values: { masterId: string }) => void
}) {
  const [selectedMasterOption, setSelectedMasterOption] = useState<SelectOption | null>(null)
  const [selectSearch, setSelectSearch] = useState(currentMasterOption.label)
  const form = useForm<{ masterId: string }>({
    initialValues: { masterId: currentMasterId },
    validate: {
      masterId: (v) => (v ? null : "Master is required"),
    },
  })
  const masterOptions = withPinnedOption(rawMasterOptions, selectedMasterOption ?? currentMasterOption)
  const selectedOption = masterOptions.find((option) => option.value === form.values.masterId) ?? null

  useEffect(() => {
    onMasterSearchChange("")
  }, [onMasterSearchChange])

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit({ masterId: values.masterId }))}>
      <Stack>
        <Select
          label="Master"
          required
          searchable
          searchValue={selectSearch}
          onSearchChange={(search) => {
            setSelectSearch(search)
            onMasterSearchChange(getMasterCustomerQuerySearch(search, selectedOption))
          }}
          value={form.values.masterId}
          onChange={(value) => {
            form.setFieldValue("masterId", value ?? "")
            const option = masterOptions.find((candidate) => candidate.value === value)
            if (option) {
              setSelectedMasterOption(option)
              setSelectSearch(option.label)
            }
            onMasterSearchChange("")
          }}
          data={masterOptions}
          error={form.errors.masterId}
        />
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!form.values.masterId || form.values.masterId === currentMasterId}
            loading={loading}
            type="submit"
          >
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
