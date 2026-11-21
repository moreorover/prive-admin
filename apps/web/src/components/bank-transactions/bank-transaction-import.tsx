import { Alert, Anchor, Button, Card, FileInput, Group, Stack, Text } from "@mantine/core"

export type BankStatementImportResult = {
  accountIban: string
  total: number
  inserted: number
  skipped: number
}

export type BankStatementImportPreview = {
  accountIban: string
  total: number
  account: { id: string; displayName: string; legalEntity: { id: string; name: string } }
}

export type BankTransactionImportProps = {
  file: File | null
  onFileChange: (file: File | null) => void
  onImport: () => void
  importPending: boolean
  importResult: BankStatementImportResult | null
  onCancel?: () => void
  onPreview?: () => void
  preview?: BankStatementImportPreview | null
  previewPending?: boolean
  error?: string | null
  setupHref?: string
}

export function BankTransactionImport({
  file,
  onFileChange,
  onImport,
  importPending,
  importResult,
  onCancel,
  onPreview,
  preview,
  previewPending = false,
  error,
  setupHref,
}: BankTransactionImportProps) {
  return (
    <Card withBorder>
      <Stack>
        <Text fw={500}>Upload bank statement (SEB or Swedbank CSV)</Text>
        <Group align="end">
          <FileInput
            disabled={importPending}
            label="Bank statement CSV"
            placeholder="Pick a .csv file"
            value={file}
            onChange={onFileChange}
            accept=".csv,text/csv"
            w={400}
          />
          {onPreview ? (
            preview ? (
              <Button onClick={onImport} loading={importPending} disabled={!file || previewPending}>
                Confirm import
              </Button>
            ) : (
              <Button onClick={onPreview} loading={previewPending} disabled={!file || importPending}>
                Preview CSV
              </Button>
            )
          ) : (
            <Button onClick={onImport} loading={importPending} disabled={!file}>
              Import
            </Button>
          )}
          {onCancel ? (
            <Button variant="default" onClick={onCancel} disabled={importPending}>
              Cancel
            </Button>
          ) : null}
        </Group>
        {preview ? (
          <Alert title="Confirm destination account">
            <Text>
              IBAN <code>{preview.accountIban}</code>
            </Text>
            <Text>
              {preview.account.displayName} · {preview.account.legalEntity.name}
            </Text>
            <Text>{preview.total} rows. Duplicate entries will be skipped.</Text>
          </Alert>
        ) : null}
        {error ? <Alert color="red">{error}</Alert> : null}
        {setupHref ? <Anchor href={setupHref}>Set up bank accounts in Legal entities</Anchor> : null}
        {importResult && (
          <Alert variant="light" color="green">
            IBAN <code>{importResult.accountIban}</code>: imported {importResult.inserted} new entries, skipped{" "}
            {importResult.skipped} duplicates (total rows {importResult.total}).
          </Alert>
        )}
      </Stack>
    </Card>
  )
}
