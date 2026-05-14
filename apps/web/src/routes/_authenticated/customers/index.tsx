import { Button, Container, Modal, Skeleton, Stack, Table, Text, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { createCustomer, getCustomers } from "@/functions/customers"
import { customerKeys } from "@/lib/query-keys"

const customersQueryOptions = queryOptions({
  queryKey: customerKeys.list(),
  queryFn: () => getCustomers(),
})

export const Route = createFileRoute("/_authenticated/customers/")({
  component: CustomersPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(customersQueryOptions)
  },
})

function CustomerFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { name: string; phoneNumber: string | null }) => createCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
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
  const { data: customers, isLoading } = useQuery(customersQueryOptions)
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
              : customers?.map((c) => (
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
            {!isLoading && customers?.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3} ta="center" c="dimmed">
                  No customers yet. Create your first one.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Section>

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Container>
  )
}
