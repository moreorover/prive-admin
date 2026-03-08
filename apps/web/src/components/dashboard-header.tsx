import { Link, useMatches } from "@tanstack/react-router"
import React from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function DashboardHeader() {
  const matches = useMatches()

  const crumbs = matches.flatMap((match) => {
    const title = (match.staticData as Record<string, unknown>)?.title
    return typeof title === "string" ? [{ title, pathname: match.pathname }] : []
  })

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4!" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => (
            <React.Fragment key={crumb.pathname}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {index < crumbs.length - 1 ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.pathname}>{crumb.title}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
