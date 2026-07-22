import { Button, Container, Group, Modal, Pagination, Stack, Table, Text, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"

import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { trpc } from "@/utils/trpc"

import { Route } from "./index"

const PAGE_SIZE = 10
export const searchSchema = z.object({
  page: z.number().int().min(1).optional(),
  search: z.string().optional(),
})

export function customersListQueryOptions(page: number, search: string) {
  return trpc.customers.list.queryOptions({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

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

export function CustomersPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const { data } = useQuery(customersListQueryOptions(page, searchValue))
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
            value={searchValue}
            onChange={(event) => {
              navigate({ search: { page: 1, search: event.currentTarget.value }, replace: true })
            }}
            miw={260}
            flex={1}
          />
          <Text size="sm" c="dimmed">
            {totalCount} customer{totalCount === 1 ? "" : "s"}
          </Text>
        </Group>
        <Table.ScrollContainer minWidth={640}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Created</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {customers.map((c) => (
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
              {customers.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3} ta="center" c="dimmed">
                    {searchValue.trim()
                      ? "No customers match your search."
                      : "No customers yet. Create your first one."}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            Page {Math.min(page, totalPages)} of {totalPages}
          </Text>
          <Pagination
            total={totalPages}
            value={Math.min(page, totalPages)}
            onChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
          />
        </Group>
      </Section>

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Container>
  )
}
