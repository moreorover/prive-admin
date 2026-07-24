import type { ComponentProps } from "react"

import { Button } from "@mantine/core"
import { Link } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { SalonsTable } from "@/components/salons-table"
import { Section } from "@/components/section"

export function SalonsTab({ salons }: { salons: ComponentProps<typeof SalonsTable>["salons"] }) {
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
