import {
  Button,
  Container,
  Divider,
  Group,
  Modal,
  Pagination,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"

import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { trpc } from "@/utils/trpc"

export const PAGE_SIZE = 10

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

type CustomerRow = {
  id: string
  name: string
  phoneNumber: string | null
  createdAt: string
}

type CustomersPageVariant = "informational" | "contextual"

type CustomersPageProps = {
  variant: CustomersPageVariant
  customers: CustomerRow[]
  totalCount: number
  page: number
  totalPages: number
  searchValue: string
  onSearchChange: (nextValue: string) => void
  onPageChange: (nextPage: number) => void
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
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <Button type="submit" loading={mutation.isPending}>
            Create customer
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

export function CustomersPage({
  variant,
  customers,
  totalCount,
  page,
  totalPages,
  searchValue,
  onSearchChange,
  onPageChange,
}: CustomersPageProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const hasSearch = searchValue.trim().length > 0

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHeader
          title="Customers"
          description={
            variant === "informational"
              ? "People you serve. Open a record to review appointments and notes."
              : "People you serve. This variant adds live list context above the search row."
          }
          actions={
            <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateOpen(true)}>
              New customer
            </Button>
          }
        />

        {variant === "contextual" ? (
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Stack gap={2}>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Summary
                </Text>
                <Text fw={600}>
                  {totalCount} customer{totalCount === 1 ? "" : "s"}
                </Text>
              </Stack>
              <Text size="sm" c="dimmed">
                {hasSearch ? `Filtered by "${searchValue.trim()}"` : "Showing all customers"}
              </Text>
            </Group>
          </Paper>
        ) : null}

        <Paper withBorder radius="md" p="md">
          <TextInput
            label="Search"
            placeholder="Search customers"
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
          />
        </Paper>

        <Paper withBorder radius="md" p={0}>
          <Table.ScrollContainer minWidth={640}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {customers.map((customer) => (
                  <Table.Tr key={customer.id}>
                    <Table.Td>
                      <Text
                        renderRoot={(props) => (
                          <Link to="/customers/$customerId" params={{ customerId: customer.id }} {...props} />
                        )}
                        c="blue"
                        fw={500}
                      >
                        {customer.name}
                      </Text>
                    </Table.Td>
                    <Table.Td c="dimmed">{customer.phoneNumber ?? "—"}</Table.Td>
                    <Table.Td c="dimmed">
                      <ClientDate date={customer.createdAt} />
                    </Table.Td>
                  </Table.Tr>
                ))}
                {customers.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3} ta="center" c="dimmed" py="xl">
                      {hasSearch ? "No customers match your search." : "No customers yet. Create your first one."}
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Divider />
          <Group justify="space-between" p="md" align="center">
            <Text size="sm" c="dimmed">
              Page {Math.min(page, totalPages)} of {totalPages}
            </Text>
            <Pagination total={totalPages} value={Math.min(page, totalPages)} onChange={onPageChange} />
          </Group>
        </Paper>
      </Stack>

      <CustomerFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </Container>
  )
}
