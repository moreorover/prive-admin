import { Button, Checkbox, Group, Modal, ScrollArea, Stack, Table, TextInput } from "@mantine/core"
import { useState } from "react"

type PersonnelOption = {
  id: string
  name: string
}

type PickPersonnelModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  search: string
  personnel: PersonnelOption[]
  loading: boolean
  onSearchChange: (search: string) => void
  onConfirm: (personnelIds: string[]) => void
}

export function PickPersonnelModal({
  open,
  onOpenChange,
  search,
  personnel,
  loading,
  onSearchChange,
  onConfirm,
}: PickPersonnelModalProps) {
  const [selected, setSelected] = useState<string[]>([])
  const selectedIds = new Set(selected)

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleClose = () => {
    setSelected([])
    onSearchChange("")
    onOpenChange(false)
  }

  return (
    <Modal opened={open} onClose={handleClose} title="Pick personnel" size="lg">
      <Stack>
        <TextInput
          label="Search"
          description="Search by personnel name"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
        />
        <ScrollArea h={300}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40} />
                <Table.Th>Name</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {personnel.length > 0 ? (
                personnel.map((c) => {
                  const checked = selectedIds.has(c.id)
                  return (
                    <Table.Tr
                      key={c.id}
                      style={{ cursor: "pointer" }}
                      bg={checked ? "var(--mantine-color-blue-light)" : undefined}
                      onClick={() => toggle(c.id)}
                    >
                      <Table.Td>
                        <Checkbox
                          checked={checked}
                          aria-label={`Select ${c.name}`}
                          onChange={() => toggle(c.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Table.Td>
                      <Table.Td>{c.name}</Table.Td>
                    </Table.Tr>
                  )
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={2} ta="center" c="dimmed">
                    No match found.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={selected.length === 0} loading={loading} onClick={() => onConfirm(selected)}>
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
