import { ActionIcon, Button, Card, Group, Menu, Stack, Text, Title } from "@mantine/core"
import { IconCash, IconDots, IconUser, IconUsers } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

type Person = { personnelId: string; personnel: { name: string } }
type Customer = { id: string; name: string }

export function AppointmentPeopleSection({
  master,
  personnel,
  onChangeMaster,
  onPickPersonnel,
  onCreateTransaction,
}: {
  master: Customer
  personnel: Person[]
  onChangeMaster: () => void
  onPickPersonnel: () => void
  onCreateTransaction: (customerId: string) => void
}) {
  return (
    <Group grow align="flex-start">
      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={5}>Master</Title>
          <Button variant="subtle" size="xs" leftSection={<IconUser size={12} />} onClick={onChangeMaster}>
            Change
          </Button>
        </Group>
        <PersonCard person={master} onCreateTransaction={onCreateTransaction} />
      </Card>

      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={5}>Personnel</Title>
          <Button variant="subtle" size="xs" leftSection={<IconUsers size={12} />} onClick={onPickPersonnel}>
            Pick
          </Button>
        </Group>
        {personnel.length > 0 ? (
          <Stack gap="xs">
            {personnel.map((person) => (
              <PersonCard
                key={person.personnelId}
                person={{ id: person.personnelId, name: person.personnel.name }}
                onCreateTransaction={onCreateTransaction}
              />
            ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            No personnel assigned.
          </Text>
        )}
      </Card>
    </Group>
  )
}

function PersonCard({ person, onCreateTransaction }: { person: Customer; onCreateTransaction: (id: string) => void }) {
  return (
    <Card withBorder padding="xs">
      <Group justify="space-between" gap="xs">
        <Group gap="xs">
          <IconUser size={12} />
          <Text
            renderRoot={(props) => <Link to="/customers/$customerId" params={{ customerId: person.id }} {...props} />}
            c="blue"
            size="sm"
          >
            {person.name}
          </Text>
        </Group>
        <Menu shadow="md" width={180} position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" size="sm" aria-label="Person actions">
              <IconDots size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconCash size={14} />} onClick={() => onCreateTransaction(person.id)}>
              New transaction
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  )
}
