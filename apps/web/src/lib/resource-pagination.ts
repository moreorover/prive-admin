export type SelectOption = {
  value: string
  label: string
}

export function clampPage({ page, pageSize, totalCount }: { page: number; pageSize: number; totalCount: number }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  return Math.min(Math.max(1, page), totalPages)
}

export function formatPageRange({
  page,
  pageSize,
  itemCount,
  totalCount,
}: {
  page: number
  pageSize: number
  itemCount: number
  totalCount: number
}) {
  if (itemCount === 0) return `showing 0 of ${totalCount}`

  const start = (page - 1) * pageSize + 1
  const end = Math.min(start + itemCount - 1, totalCount)
  return `showing ${start}-${end} of ${totalCount}`
}

export function withPinnedOption<TOption extends SelectOption>(options: TOption[], pinnedOption?: TOption | null) {
  if (!pinnedOption || options.some((option) => option.value === pinnedOption.value)) return options
  return [pinnedOption, ...options]
}
