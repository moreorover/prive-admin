import { Button, Container, Group, Modal, Pagination, Stack, Table, Text, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"

const PAGE_SIZE = 10
type CustomerListData = {
  items: {
    id: string
    name: string
    phoneNumber: string | null
    createdAt: Date | string
  }[]
  totalCount: number
}
type CustomerCreateValues = { name: string; phoneNumber: string | null }

function CustomerFormDialog({
  open,
  onOpenChange,
  loading,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  onCreate: (values: CustomerCreateValues) => Promise<unknown>
}) {
  const form = useForm({
    initialValues: { name: "", phoneNumber: "" },
  })

  const handleSubmit = async (values: { name: string; phoneNumber: string }) => {
    await onCreate({
      name: values.name,
      phoneNumber: values.phoneNumber || null,
    })
    onOpenChange(false)
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone Number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <Button type="submit" loading={loading}>
            Create Customer
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

type CustomersPageProps = {
  page: number
  searchValue: string
  data: CustomerListData | undefined
  createCustomerPending: boolean
  onCreateCustomer: (values: CustomerCreateValues) => Promise<unknown>
  onSearchChange: (search: string) => void
  onPageChange: (page: number) => void
}

export function CustomersPage({
  page,
  searchValue,
  data,
  createCustomerPending,
  onCreateCustomer,
  onSearchChange,
  onPageChange,
}: CustomersPageProps) {
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
              onSearchChange(event.currentTarget.value)
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
          <Pagination total={totalPages} value={Math.min(page, totalPages)} onChange={onPageChange} />
        </Group>
      </Section>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        loading={createCustomerPending}
        onCreate={onCreateCustomer}
      />
    </Container>
  )
}
