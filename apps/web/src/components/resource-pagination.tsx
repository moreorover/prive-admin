import type { ReactNode } from "react"

import { Group, Pagination, Text } from "@mantine/core"
import { usePagination } from "@mantine/hooks"

export type ResourcePaginationProps = {
  page: number
  pageSize: number
  totalCount: number
  onChange: (page: number) => void
  label?: ReactNode
  mt?: "md"
  px?: "md"
  pb?: "md"
  p?: "md"
  size?: "sm"
}

function getTotalPages(totalCount: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalCount / pageSize))
}

export function ResourcePagination({
  page,
  pageSize,
  totalCount,
  onChange,
  label,
  mt,
  px,
  pb,
  p,
  size,
}: ResourcePaginationProps) {
  const totalPages = getTotalPages(totalCount, pageSize)
  const clampedPage = Math.min(page, totalPages)
  const pagination = usePagination({ total: totalPages, page: clampedPage, onChange })

  return (
    <Group justify={label ? "space-between" : "flex-end"} mt={mt} px={px} pb={pb} p={p}>
      {label ? (
        <Text size="sm" c="dimmed">
          {label} · Page {pagination.active} of {totalPages}
        </Text>
      ) : null}
      <Pagination size={size} total={totalPages} value={pagination.active} onChange={pagination.setPage} />
    </Group>
  )
}
