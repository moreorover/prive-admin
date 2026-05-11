import { Tabs } from "@mantine/core"
import { Link, useLocation } from "@tanstack/react-router"

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
          >
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  )
}
