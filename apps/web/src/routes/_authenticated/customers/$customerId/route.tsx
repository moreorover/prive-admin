import { Button, Card, Container, Group, Modal, SimpleGrid, Stack, Tabs, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPencil, IconPhone } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router"
import { useState } from "react"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { CURRENCIES, formatMinor } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  component: CustomerDetailRoute,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(trpc.customers.get.queryOptions({ id: params.customerId })),
      context.queryClient.ensureQueryData(trpc.customers.summary.queryOptions({ id: params.customerId })),
    ])
  },
})

function CustomerDetailRoute() {
  const { customerId } = Route.useParams()
  const navigate = Route.useNavigate()
  const location = useLocation()

  const { data: customer } = useQuery(trpc.customers.get.queryOptions({ id: customerId }))
  const { data: summary } = useQuery(trpc.customers.summary.queryOptions({ id: customerId }))
  const [editOpen, setEditOpen] = useState(false)

  const activeTab = location.pathname.endsWith("/notes")
    ? "notes"
    : location.pathname.endsWith("/hair-sales")
      ? "hair-sales"
      : "appointments"

  if (!customer || !summary) {
    return (
      <Container size="xl">
        <Text c="dimmed">Customer not found.</Text>
      </Container>
    )
  }

  const handleTabChange = (value: string | null) => {
    if (!value || value === activeTab) return
    if (value === "appointments") {
      navigate({ to: "/customers/$customerId/appointments", params: { customerId } })
      return
    }
    if (value === "notes") {
      navigate({ to: "/customers/$customerId/notes", params: { customerId } })
      return
    }
    if (value === "hair-sales") {
      navigate({ to: "/customers/$customerId/hair-sales", params: { customerId } })
    }
  }

  return (
    <Container size="xl">
      <BreadcrumbItem label={customer.name} to={`/customers/${customerId}/appointments`} order={20} />
      <PageHeader
        title={customer.name}
        description={
          customer.phoneNumber ? (
            <Group gap={4}>
              <IconPhone size={12} />
              <Text size="sm" c="dimmed">
                {customer.phoneNumber}
              </Text>
            </Group>
          ) : undefined
        }
        actions={
          <Button variant="default" leftSection={<IconPencil size={14} />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        }
      />
      <Stack>
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
          <StatCard label="Appointments" value={String(summary.appointmentCount)} />
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Transactions
            </Text>
            <Title order={4}>
              {(() => {
                const parts = CURRENCIES.flatMap((currency) =>
                  summary.transactionSumsMinor[currency] !== 0
                    ? [formatMinor(summary.transactionSumsMinor[currency], currency)]
                    : [],
                )
                return parts.length > 0 ? parts.join(" · ") : formatMinor(0, "EUR")
              })()}
            </Title>
          </Card>
          <StatCard label="Hair profit" value={`€${summary.hairAssignedProfitSum.toFixed(2)}`} />
          <StatCard label="Hair sold for" value={`€${summary.hairAssignedSoldForSum.toFixed(2)}`} />
          <StatCard label="Hair weight" value={`${summary.hairAssignedWeightInGramsSum}g`} />
          <StatCard label="Notes" value={String(summary.noteCount)} />
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Joined
            </Text>
            <Title order={4}>
              <ClientDate date={summary.customerCreatedAt} />
            </Title>
          </Card>
        </SimpleGrid>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="appointments">Appointments</Tabs.Tab>
            <Tabs.Tab value="notes">Notes</Tabs.Tab>
            <Tabs.Tab value="hair-sales">Hair Sales</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Outlet />

        <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
      </Stack>
    </Container>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card withBorder padding="md">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Title order={4}>{value}</Title>
    </Card>
  )
}

function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: { id: string; name: string; phoneNumber: string | null }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    ...trpc.customers.update.mutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.customers.list.queryKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.customers.get.queryOptions({ id: customer.id }).queryKey }),
        queryClient.invalidateQueries({ queryKey: trpc.customers.summary.queryOptions({ id: customer.id }).queryKey }),
      ])
      onOpenChange(false)
      notifications.show({ color: "green", message: "Customer updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: {
      name: customer.name,
      phoneNumber: customer.phoneNumber ?? "",
    },
  })

  const handleSubmit = async (values: { name: string; phoneNumber: string }) => {
    await mutation.mutateAsync({
      id: customer.id,
      name: values.name,
      phoneNumber: values.phoneNumber || null,
    })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone Number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <Button type="submit" loading={mutation.isPending}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
