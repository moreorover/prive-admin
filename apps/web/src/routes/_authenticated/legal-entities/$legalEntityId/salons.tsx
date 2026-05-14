import { Button } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { SalonsTable } from "@/components/salons-table"
import { Section } from "@/components/section"
import { listSalons } from "@/functions/salons"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/salons")({
  component: SalonsTab,
})

function SalonsTab() {
  const q = useQuery({ queryKey: ["salons"], queryFn: () => listSalons() })

  return (
    <Section
      title="Salons"
      description="Locations associated with this legal entity."
      actions={
        <Button
          size="sm"
          variant="default"
          renderRoot={(props) => <Link to="/salons/$salonId" params={{ salonId: "new" }} {...props} />}
        >
          New salon
        </Button>
      }
    >
      <SalonsTable salons={q.data ?? []} />
    </Section>
  )
}
