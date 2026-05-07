import { Anchor, Button, Card, Group, Stack, Table, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { listBankAccounts } from "@/functions/bank-accounts"

export const Route = createFileRoute("/_authenticated/bank-accounts/")({
  component: BankAccountsIndex,
})

function BankAccountsIndex() {
  const q = useQuery({ queryKey: ["bank-accounts"], queryFn: () => listBankAccounts() })

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={3}>Bank accounts</Title>
        <Button
          renderRoot={(props) => (
            <Link to="/bank-accounts/$bankAccountId" params={{ bankAccountId: "new" }} {...props} />
          )}
        >
          New bank account
        </Button>
      </Group>
      <Card withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Legal entity</Table.Th>
              <Table.Th>IBAN</Table.Th>
              <Table.Th>Currency</Table.Th>
              <Table.Th>Bank</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(q.data ?? []).map((a) => (
              <Table.Tr key={a.id}>
                <Table.Td>{a.displayName}</Table.Td>
                <Table.Td>{a.legalEntity?.name}</Table.Td>
                <Table.Td>
                  <code>{a.iban}</code>
                </Table.Td>
                <Table.Td>{a.currency}</Table.Td>
                <Table.Td>{a.bankName ?? "—"}</Table.Td>
                <Table.Td>
                  <Anchor
                    renderRoot={(props) => (
                      <Link to="/bank-accounts/$bankAccountId" params={{ bankAccountId: a.id }} {...props} />
                    )}
                  >
                    Edit
                  </Anchor>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  )
}
