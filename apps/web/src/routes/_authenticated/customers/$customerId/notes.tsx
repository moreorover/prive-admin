import { ActionIcon, Button, Card, Group, Modal, Pagination, Stack, Text, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { ClientDate } from "@prive-admin-tanstack/ui/components/client-date"
import { Section } from "@prive-admin-tanstack/ui/components/section"
import { IconPlus, IconSearch, IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { trpc } from "@/utils/trpc"

const PAGE_SIZE = 25
const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
})

function notesQueryOptions(customerId: string, page: number, search: string) {
  return trpc.customers.notes.list.queryOptions({
    customerId,
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

export const Route = createFileRoute("/_authenticated/customers/$customerId/notes")({
  component: NotesRoute,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps, params }) => {
    const data = await context.queryClient.ensureQueryData(notesQueryOptions(params.customerId, deps.page, deps.search))
    const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/customers/$customerId/notes",
        params: { customerId: params.customerId },
        search: { page: totalPages, search: deps.search },
      })
    }
  },
})

type CustomerNote = {
  id: string
  note: string
  createdAt: Date | string
  createdBy?: { name: string | null } | null
}

function NotesRoute() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const normalizedSearch = searchValue.trim()
  const queryOptions = notesQueryOptions(customerId, page, searchValue)
  const { data } = useQuery(queryOptions)
  const notes = (data?.items ?? []) as CustomerNote[]
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const hasItemsOnCurrentPage = notes.length > 0

  const deleteNoteMutation = useMutation({
    ...trpc.notes.delete.mutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.customers.notes.list.queryKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey }),
      ])
      notifications.show({ color: "green", message: "Note deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <>
      <BreadcrumbItem label="Notes" order={30} />
      <Section
        title="Notes"
        description="Customer notes and internal reminders."
        actions={
          <>
            <TextInput
              label="Search"
              placeholder="Search notes"
              leftSection={<IconSearch size={16} />}
              value={searchValue}
              onChange={(event) => {
                navigate({ search: { page: 1, search: event.currentTarget.value }, replace: true })
              }}
              w={260}
            />
            <Button
              variant="default"
              size="sm"
              leftSection={<IconPlus size={12} />}
              onClick={() => setDialogOpen(true)}
            >
              Add
            </Button>
          </>
        }
        padding={hasItemsOnCurrentPage ? 0 : "lg"}
      >
        <Stack gap="md">
          {hasItemsOnCurrentPage ? (
            <Stack gap="xs">
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
              {normalizedSearch ? "No notes match your search." : "No notes on this page."}
            </Text>
          )}

          <Group justify="space-between" px="md" pb="md">
            <Text size="sm" c="dimmed">
              {totalCount} note{totalCount === 1 ? "" : "s"} · Page {clampedPage} of {totalPages}
            </Text>
            <Pagination
              value={clampedPage}
              total={totalPages}
              onChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
            />
          </Group>
        </Stack>

        <AddNoteDialog
          customerId={customerId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => navigate({ search: { page: 1, search: searchValue }, replace: true })}
        />
      </Section>
    </>
  )
}

function AddNoteDialog({
  customerId,
  open,
  onOpenChange,
  onSuccess,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm({
    initialValues: { note: "" },
  })

  const mutation = useMutation({
    ...trpc.notes.create.mutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.customers.notes.list.queryKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey }),
      ])
      onSuccess()
      onOpenChange(false)
      form.reset()
      notifications.show({ color: "green", message: "Note added" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal
      opened={open}
      onClose={() => {
        onOpenChange(false)
        form.reset()
      }}
      title="Add Note"
    >
      <form onSubmit={form.onSubmit(async (values) => mutation.mutateAsync({ note: values.note, customerId }))}>
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
