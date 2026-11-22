import { Anchor, Button, Group, Table } from "@mantine/core"
import { Link } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { Section } from "@/components/section"

type BankAccount = {
  id: string
  displayName: string
  iban: string
  currency: string
  bankName: string | null
}

export function BankAccountsTab({
  legalEntityId,
  legalEntity,
}: {
  legalEntityId: string
  legalEntity: { bankAccounts: BankAccount[] } | undefined
}) {
  const bankAccounts = legalEntity?.bankAccounts ?? []

  return (
    <>
      <BreadcrumbItem label="Bank accounts" order={30} />
      <Section
        title="Bank accounts"
        description="Accounts that feed bank-statement imports."
        actions={
          <Group>
            <Button
              size="sm"
              variant="default"
              renderRoot={(props) => (
                <Link
                  to="/bank-transactions"
                  search={{ entityId: legalEntityId, status: "PENDING", page: 1 }}
                  {...props}
                />
              )}
            >
              Bank transactions
            </Button>
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
          </Group>
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
            {bankAccounts.map((a) => (
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
                  <Anchor
                    renderRoot={(props) => (
                      <Link
                        to="/bank-transactions"
                        search={{ entityId: legalEntityId, bankAccountId: a.id, status: "PENDING", page: 1 }}
                        {...props}
                      />
                    )}
                  >
                    <code>{a.iban}</code>
                  </Anchor>
                </Table.Td>
                <Table.Td>{a.currency}</Table.Td>
                <Table.Td>{a.bankName ?? "—"}</Table.Td>
              </Table.Tr>
            ))}
            {legalEntity && bankAccounts.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} ta="center" c="dimmed">
                  No bank accounts.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Section>
    </>
  )
}
