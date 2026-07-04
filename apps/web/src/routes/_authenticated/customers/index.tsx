import { Button, Container, Group, Modal, Skeleton, Stack, Table, Text, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { trpc } from "@/utils/trpc"

const PAGE_SIZE = 25
const defaultCustomersListInput = { page: 1, pageSize: PAGE_SIZE, search: undefined as string | undefined }
const customersQueryOptions = trpc.customers.list.queryOptions(defaultCustomersListInput)

export const Route = createFileRoute("/_authenticated/customers/")({
  component: CustomersPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(customersQueryOptions)
  },
})

function CustomerFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    ...trpc.customers.create.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.customers.list.queryKey() })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Customer created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: { name: "", phoneNumber: "" },
  })

  const handleSubmit = async (values: { name: string; phoneNumber: string }) => {
    await mutation.mutateAsync({
      name: values.name,
      phoneNumber: values.phoneNumber || null,
    })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone Number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <Button type="submit" loading={mutation.isPending}>
            Create Customer
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const listInput = {
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  }
  const { data, isLoading } = useQuery(
    trpc.customers.list.queryOptions(listInput, { placeholderData: (previousData) => previousData }),
  )
  const customers = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Container size="xl">
      <PageHeader
        title="Customers"
        description="People you serve. Click a name to see their appointments and notes."
        actions={
          <Button leftSection={<IconPlus size={14} />} onClick={() => setDialogOpen(true)}>
            New customer
          </Button>
        }
      />
      <Section padding={0}>
        <Group p="md" justify="space-between" align="flex-end">
          <TextInput
            label="Search"
            placeholder="Search customers"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value)
              setPage(1)
            }}
            miw={260}
            flex={1}
          />
          <Text size="sm" c="dimmed">
            {totalCount} customer{totalCount === 1 ? "" : "s"}
          </Text>
        </Group>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Created</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Skeleton h={14} w={120} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={90} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={70} />
                    </Table.Td>
                  </Table.Tr>
                ))
              : customers.map((c) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Text
                        renderRoot={(props) => (
                          <Link to="/customers/$customerId" params={{ customerId: c.id }} {...props} />
                        )}
                        c="blue"
                        fw={500}
                      >
                        {c.name}
                      </Text>
                    </Table.Td>
                    <Table.Td c="dimmed">{c.phoneNumber ?? "—"}</Table.Td>
                    <Table.Td c="dimmed">
                      <ClientDate date={c.createdAt} />
                    </Table.Td>
                  </Table.Tr>
                ))}
            {!isLoading && customers.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3} ta="center" c="dimmed">
                  {search.trim() ? "No customers match your search." : "No customers yet. Create your first one."}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            Page {Math.min(page, totalPages)} of {totalPages}
          </Text>
          <Group gap="xs">
            <Button
              variant="default"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button variant="default" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </Group>
        </Group>
      </Section>

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Container>
  )
}
