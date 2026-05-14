import { Anchor, Button, Table } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { Section } from "@/components/section"
import { getLegalEntity } from "@/functions/legal-entities"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/bank-accounts/")({
  component: BankAccountsTab,
})

function BankAccountsTab() {
  const { legalEntityId } = Route.useParams()
  const q = useQuery({
    queryKey: ["legal-entity", legalEntityId],
    queryFn: () => getLegalEntity({ data: { id: legalEntityId } }),
  })

  return (
    <Section
      title="Bank accounts"
      description="Accounts that feed bank-statement imports."
      actions={
        <Button
          size="sm"
          variant="default"
          renderRoot={(props) => (
            <Link
              to="/legal-entities/$legalEntityId/bank-accounts/$bankAccountId"
              params={{ legalEntityId, bankAccountId: "new" }}
              {...props}
            />
          )}
        >
          New bank account
        </Button>
      }
      padding={0}
    >
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>IBAN</Table.Th>
            <Table.Th>Currency</Table.Th>
            <Table.Th>Bank</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(q.data?.bankAccounts ?? []).map((a) => (
            <Table.Tr key={a.id}>
              <Table.Td>
                <Anchor
                  renderRoot={(props) => (
                    <Link
                      to="/legal-entities/$legalEntityId/bank-accounts/$bankAccountId"
                      params={{ legalEntityId, bankAccountId: a.id }}
                      {...props}
                    />
                  )}
                >
                  {a.displayName}
                </Anchor>
              </Table.Td>
              <Table.Td>
                <code>{a.iban}</code>
              </Table.Td>
              <Table.Td>{a.currency}</Table.Td>
              <Table.Td>{a.bankName ?? "—"}</Table.Td>
            </Table.Tr>
          ))}
          {q.data && q.data.bankAccounts.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4} ta="center" c="dimmed">
                No bank accounts.
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Section>
  )
}
