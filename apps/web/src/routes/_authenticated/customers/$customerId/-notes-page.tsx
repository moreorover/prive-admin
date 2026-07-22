import { ActionIcon, Button, Card, Group, Modal, Pagination, Stack, Text, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { IconPlus, IconSearch, IconTrash } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { ClientDate } from "@/components/client-date"
import { Section } from "@/components/section"

import { useCustomerNoteActions } from "./-note-actions"
import { notesQueryOptions, PAGE_SIZE } from "./-notes-data"
import { Route } from "./notes"

type CustomerNote = {
  id: string
  note: string
  createdAt: Date | string
  createdBy?: { name: string | null } | null
}

export function NotesRoute() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
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

  const { createNote, deleteNote } = useCustomerNoteActions({
    customerId,
    onCreated: () => navigate({ search: { page: 1, search: searchValue }, replace: true }),
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
                    <ActionIcon variant="subtle" color="red" onClick={() => deleteNote.mutate({ id: note.id })}>
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
          loading={createNote.isPending}
          onCreate={(values) => createNote.mutateAsync(values)}
        />
      </Section>
    </>
  )
}

function AddNoteDialog({
  customerId,
  open,
  onOpenChange,
  loading,
  onCreate,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  onCreate: (values: { note: string; customerId: string }) => Promise<unknown>
}) {
  const form = useForm({
    initialValues: { note: "" },
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
      <form
        onSubmit={form.onSubmit(async (values) => {
          await onCreate({ note: values.note, customerId })
          onOpenChange(false)
          form.reset()
        })}
      >
        <Stack>
          <Textarea label="Note" placeholder="Write a note…" minRows={3} {...form.getInputProps("note")} />
          <Button type="submit" loading={loading}>
            Add Note
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
