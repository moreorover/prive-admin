function normalizeBankAccountIdentifier(value: string) {
  return value.replace(/\s/g, "").toUpperCase()
}

export function formatBankAccountLabel(input: {
  displayName?: string | null
  iban?: string | null
  legalEntityName?: string | null
}) {
  const displayName = input.displayName?.trim() ?? ""
  const iban = input.iban?.trim() ?? ""
  const sameAsIban =
    displayName.length > 0 &&
    iban.length > 0 &&
    normalizeBankAccountIdentifier(displayName) === normalizeBankAccountIdentifier(iban)
  const accountLabel = sameAsIban ? iban : [iban, displayName].filter(Boolean).join(" · ")
  return [accountLabel, input.legalEntityName?.trim()].filter(Boolean).join(" · ")
}
