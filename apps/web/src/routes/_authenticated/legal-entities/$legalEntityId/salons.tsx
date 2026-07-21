import { Button } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { SalonsTable } from "@/components/salons-table"
import { Section } from "@/components/section"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/salons")({
  component: SalonsTab,
})

function SalonsTab() {
  const { data: salonsData } = useQuery(trpc.salons.list.queryOptions({ pageSize: 100 }))
  const salons = salonsData?.items ?? []

  return (
    <>
      <BreadcrumbItem label="Salons" order={30} />
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
        <SalonsTable salons={salons} />
      </Section>
    </>
  )
}
