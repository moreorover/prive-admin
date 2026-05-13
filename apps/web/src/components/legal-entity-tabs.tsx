import { Badge, Group, Tabs } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, useLocation } from "@tanstack/react-router"

import { listUnassignedAttachments } from "@/functions/bank-statement-attachments"

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "documents", label: "Documents" },
  { value: "bank-accounts", label: "Bank accounts" },
  { value: "reports", label: "Reports" },
  { value: "salons", label: "Salons" },
] as const

export function LegalEntityTabs({ legalEntityId }: { legalEntityId: string }) {
  const location = useLocation()
  const segment = location.pathname.split(`/legal-entities/${legalEntityId}/`)[1]?.split("/")[0] ?? "overview"
  const active = TABS.find((t) => t.value === segment)?.value ?? "overview"

  const unassignedQuery = useQuery({
    queryKey: ["bank-statement-attachments", "unassigned"],
    queryFn: () => listUnassignedAttachments(),
  })
  const unassignedCount = unassignedQuery.data?.length ?? 0

  return (
    <Tabs value={active} variant="outline" mb="md">
      <Tabs.List>
        {TABS.map((t) => (
          <Tabs.Tab
            key={t.value}
            value={t.value}
            renderRoot={(props) => (
              <Link to={`/legal-entities/$legalEntityId/${t.value}`} params={{ legalEntityId }} {...props} />
            )}
            rightSection={
              t.value === "documents" && unassignedCount > 0 ? (
                <Badge size="xs" variant="filled" color="orange" circle>
                  {unassignedCount}
                </Badge>
              ) : undefined
            }
          >
            <Group gap={6} wrap="nowrap">
              {t.label}
            </Group>
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  )
}
