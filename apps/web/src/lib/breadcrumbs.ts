import type { ReactNode } from "react"

export type BreadcrumbDefinition = {
  label: ReactNode
  to?: string
  order?: number
}

export type RegisteredBreadcrumb = BreadcrumbDefinition & {
  id: string
  order: number
}

export function defineBreadcrumbs<const T extends readonly BreadcrumbDefinition[]>(items: T): T {
  return items
}

export function upsertBreadcrumb(
  items: readonly RegisteredBreadcrumb[],
  item: RegisteredBreadcrumb,
): RegisteredBreadcrumb[] {
  return [...items.filter((candidate) => candidate.id !== item.id), item].sort((a, b) => a.order - b.order)
}

export function removeBreadcrumb(items: readonly RegisteredBreadcrumb[], id: string): RegisteredBreadcrumb[] {
  return items.filter((item) => item.id !== id)
}
