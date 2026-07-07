import { Box, Button, Modal, SimpleGrid, Stack, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPencil } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { CustomerDetailFrame } from "@/components/customer-detail-frame"
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
  const [editOpen, setEditOpen] = useState(false)

  const { data: customer } = useQuery(trpc.customers.get.queryOptions({ id: customerId }))
  const { data: summary } = useQuery(trpc.customers.summary.queryOptions({ id: customerId }))

  const activeTab = location.pathname.endsWith("/notes")
    ? "notes"
    : location.pathname.endsWith("/hair-sales")
      ? "hair-sales"
      : "appointments"

  if (!customer || !summary) {
    return (
      <Box p="xl">
        <Text c="dimmed">Customer not found.</Text>
      </Box>
    )
  }

  return (
    <CustomerDetailFrame
      customerName={customer.name}
      customerPhone={customer.phoneNumber}
      joinedLabel={<ClientDate date={summary.customerCreatedAt} />}
      summaryCards={<CustomerSummaryGrid summary={summary} />}
      quickActions={
        <Button variant="default" leftSection={<IconPencil size={14} />} onClick={() => setEditOpen(true)}>
          Edit customer
        </Button>
      }
      activeTab={activeTab}
      onTabChange={(value) => {
        if (!value || value === activeTab) return
        navigate({ to: `/customers/$customerId/${value}`, params: { customerId } })
      }}
    >
      <Outlet />
      <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
    </CustomerDetailFrame>
  )
}

function CustomerSummaryGrid({
  summary,
}: {
  summary: {
    appointmentCount: number
    noteCount: number
    transactionSumsMinor: Record<string, number>
    hairAssignedProfitSum: number
    hairAssignedSoldForSum: number
  }
}) {
  const transactionParts = CURRENCIES.flatMap((currency) =>
    summary.transactionSumsMinor[currency] !== 0 ? [formatMinor(summary.transactionSumsMinor[currency], currency)] : [],
  )

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
      <SummaryField label="Appointments" value={String(summary.appointmentCount)} detail="Total appointments" />
      <SummaryField label="Notes" value={String(summary.noteCount)} detail="Internal notes" />
      <SummaryField
        label="Transactions"
        value={transactionParts.length > 0 ? transactionParts.join(" · ") : formatMinor(0, "EUR")}
        detail="Across currencies"
      />
      <SummaryField label="Hair profit" value={`€${summary.hairAssignedProfitSum.toFixed(2)}`} detail="Net profit" />
      <SummaryField
        label="Hair sold for"
        value={`€${summary.hairAssignedSoldForSum.toFixed(2)}`}
        detail="Gross sales"
      />
    </SimpleGrid>
  )
}

function SummaryField({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Stack gap={4} py="xs" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={700} lh={1.1} style={{ letterSpacing: "0.08em" }}>
        {label}
      </Text>
      <Title order={4} fw={700} lh={1.2}>
        {value}
      </Title>
      <Text size="xs" c="dimmed">
        {detail}
      </Text>
    </Stack>
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
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <Button type="submit" loading={mutation.isPending}>
            Save changes
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
