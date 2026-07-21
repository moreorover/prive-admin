import { type Currency, formatMinor } from "./currency"

export type DocumentMatchCandidate = {
  id: string
  date: string
  amount: number
  currency: string
  direction: string
  counterpartyName: string | null
  status: string
  bankAccount: {
    id: string
    displayName: string
    bankName: string | null
    legalEntity: { id: string; name: string }
  }
}

export type DocumentMatchCandidateFilters = {
  legalEntityId: string
  bankAccountId: string
  counterparty: string
  date: string
  amount: string
}

export function filterDocumentMatchCandidates(
  candidates: DocumentMatchCandidate[],
  filters: DocumentMatchCandidateFilters,
) {
  const counterparty = normalize(filters.counterparty)
  const date = normalize(filters.date)
  const amount = normalize(filters.amount)

  return candidates.filter((candidate) => {
    if (filters.legalEntityId && candidate.bankAccount.legalEntity.id !== filters.legalEntityId) return false
    if (filters.bankAccountId && candidate.bankAccount.id !== filters.bankAccountId) return false
    if (counterparty && !normalize(candidate.counterpartyName ?? "").includes(counterparty)) return false
    if (date && !normalize(candidate.date).includes(date)) return false
    if (amount && !normalize(formatCandidateAmount(candidate)).includes(amount)) return false
    return true
  })
}

export function getDocumentMatchFilterOptions(candidates: DocumentMatchCandidate[], legalEntityId: string) {
  const legalEntities = uniqueOptions(
    candidates.map((candidate) => ({
      value: candidate.bankAccount.legalEntity.id,
      label: candidate.bankAccount.legalEntity.name,
    })),
  )

  const bankAccountCandidates = legalEntityId
    ? candidates.filter((candidate) => candidate.bankAccount.legalEntity.id === legalEntityId)
    : candidates
  const bankAccounts = uniqueOptions(
    bankAccountCandidates.map((candidate) => ({
      value: candidate.bankAccount.id,
      label: candidate.bankAccount.bankName
        ? `${candidate.bankAccount.displayName} · ${candidate.bankAccount.bankName}`
        : candidate.bankAccount.displayName,
    })),
  )

  return { legalEntities, bankAccounts }
}

export function getDocumentMatchCandidatePage<T>(candidates: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(candidates.length / pageSize))
  const clampedPage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (clampedPage - 1) * pageSize
  const items = candidates.slice(startIndex, startIndex + pageSize)
  return {
    items,
    page: clampedPage,
    totalPages,
    start: candidates.length === 0 ? 0 : startIndex + 1,
    end: startIndex + items.length,
  }
}

export function formatCandidateAmount(candidate: Pick<DocumentMatchCandidate, "amount" | "currency" | "direction">) {
  return `${candidate.direction === "C" ? "+" : "-"}${formatMinor(
    Math.abs(candidate.amount),
    candidate.currency as Currency,
  )}`
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function uniqueOptions(options: Array<{ value: string; label: string }>) {
  const seen = new Set<string>()
  const unique = []
  for (const option of options) {
    if (seen.has(option.value)) continue
    seen.add(option.value)
    unique.push(option)
  }
  return unique
}
