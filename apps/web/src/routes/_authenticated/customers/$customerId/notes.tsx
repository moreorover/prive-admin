import { ActionIcon, Button, Card, Group, Modal, Pagination, Stack, Text, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconSearch, IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { ClientDate } from "@/components/client-date"
import { Section } from "@/components/section"
import { clampPage } from "@/lib/resource-pagination"
import { trpc } from "@/utils/trpc"

import {
  CUSTOMER_DETAIL_PAGE_SIZE,
  customerDetailQueryInput,
  customerDetailSearchSchema,
  customerNotesQueryArgs,
} from "./customer-detail-queries"

type CustomerNote = {
  id: string
  note: string
  createdAt: Date | string
  createdBy?: { name: string | null } | null
}

export const Route = createFileRoute("/_authenticated/customers/$customerId/notes")({
  validateSearch: customerDetailSearchSchema,
  loaderDeps: ({ search }) => customerDetailQueryInput(search),
  loader: async ({ context, deps, params }) => {
    await context.queryClient.ensureQueryData(
      trpc.customers.notes.list.queryOptions(customerNotesQueryArgs(params.customerId, deps)),
    )
  },
  component: CustomerNotesRoute,
})

function CustomerNotesRoute() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryInput = customerNotesQueryArgs(customerId, search)
  const queryClient = useQueryClient()
  const { data } = useQuery(trpc.customers.notes.list.queryOptions(queryInput))
  const [dialogOpen, setDialogOpen] = useState(false)

  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const notes = (data?.items ?? []) as CustomerNote[]
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / CUSTOMER_DETAIL_PAGE_SIZE))
  const clampedPage = clampPage({ page, pageSize: CUSTOMER_DETAIL_PAGE_SIZE, totalCount })

  useEffect(() => {
    if (page !== clampedPage) {
      navigate({ search: { page: clampedPage, search: searchValue }, replace: true })
    }
  }, [clampedPage, navigate, page, searchValue])

  const deleteNoteMutation = useMutation({
    ...trpc.notes.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.customers.notes.list.queryKey(queryInput) })
      queryClient.invalidateQueries({ queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey })
      notifications.show({ color: "green", message: "Note deleted" })
    },
  })

  const updateSearch = (value: string) => {
    navigate({ search: { page: 1, search: value }, replace: true })
  }

  return (
    <Section
      title="Notes"
      actions={
        <Button variant="default" size="sm" leftSection={<IconPlus size={12} />} onClick={() => setDialogOpen(true)}>
          Add
        </Button>
      }
      padding={notes.length > 0 || totalCount > 0 ? 0 : "lg"}
    >
      <Group p="md" justify="space-between" align="flex-end">
        <TextInput
          label="Search"
          placeholder="Search notes"
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(event) => updateSearch(event.currentTarget.value)}
          miw={260}
          flex={1}
        />
        <Text size="sm" c="dimmed">
          {totalCount} note{totalCount === 1 ? "" : "s"}
        </Text>
      </Group>

      {notes.length > 0 ? (
        <Stack gap="xs" p="md">
          {notes.map((note) => (
            <Card key={note.id} padding="sm">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Text size="sm">{note.note}</Text>
                  <Text size="xs" c="dimmed">
                    {note.createdBy?.name ?? "Unknown"} · <ClientDate date={note.createdAt} />
                  </Text>
                </Stack>
                <ActionIcon variant="subtle" color="red" onClick={() => deleteNoteMutation.mutate({ id: note.id })}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </Stack>
      ) : (
        <Text size="sm" c="dimmed" p="lg">
          {searchValue.trim() ? "No notes match your search." : "No notes yet."}
        </Text>
      )}

      {totalCount > 0 && (
        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            Page {clampedPage} of {totalPages}
          </Text>
          <Pagination
            value={clampedPage}
            total={totalPages}
            onChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
          />
        </Group>
      )}

      <AddNoteDialog
        customerId={customerId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invalidateQueryKey={queryInput}
      />
    </Section>
  )
}

function AddNoteDialog({
  customerId,
  open,
  onOpenChange,
  invalidateQueryKey,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  invalidateQueryKey: { customerId: string; page: number; pageSize: number; search?: string }
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    ...trpc.notes.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.customers.notes.list.queryKey(invalidateQueryKey) })
      queryClient.invalidateQueries({ queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Note added" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({ initialValues: { note: "" } })

  const handleSubmit = async (values: { note: string }) => {
    await mutation.mutateAsync({ note: values.note, customerId })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Add Note">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Textarea label="Note" placeholder="Write a note…" minRows={3} {...form.getInputProps("note")} />
          <Button type="submit" loading={mutation.isPending}>
            Add Note
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
