import { Tabs } from "@mantine/core"
import { Link, useLocation } from "@tanstack/react-router"

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "bank-accounts", label: "Bank accounts" },
  { value: "reports", label: "Reports" },
  { value: "hair-orders", label: "Hair orders" },
  { value: "salons", label: "Salons" },
] as const

export function LegalEntityTabs({ legalEntityId }: { legalEntityId: string }) {
  const location = useLocation()
  const active = TABS.find((t) => location.pathname.endsWith(`/${t.value}`))?.value ?? "overview"

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
