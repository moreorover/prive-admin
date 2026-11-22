import { Alert, Anchor, Button, Card, FileInput, Group, Modal, Stack, Text } from "@mantine/core"

export type BankStatementImportResult = {
  accountIban: string
  total: number
  inserted: number
  skipped: number
}

export type BankStatementImportPreview = BankStatementImportResult & {
  account: { id: string; displayName: string; legalEntity: { id: string; name: string } }
}

export type BankTransactionImportProps = {
  opened?: boolean
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
  opened,
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
  const content = (
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
          w="100%"
        />
        {opened !== undefined || onPreview ? (
          preview ? (
            <Button onClick={onImport} loading={importPending} disabled={!file || previewPending}>
              Confirm import
            </Button>
          ) : opened !== undefined ? null : (
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
            {importResult ? "Close" : "Cancel"}
          </Button>
        ) : null}
      </Group>
      <BankStatementImportFeedback
        preview={preview}
        previewPending={previewPending}
        error={error}
        setupHref={setupHref}
        importResult={importResult}
      />
    </Stack>
  )
  return opened !== undefined ? (
    <Modal
      opened={opened}
      onClose={onCancel ?? (() => {})}
      title="Import bank statement CSV"
      size="lg"
      closeOnClickOutside={!importPending}
      closeOnEscape={!importPending}
      withCloseButton={!importPending}
    >
      {content}
    </Modal>
  ) : (
    <Card withBorder>{content}</Card>
  )
}

function BankStatementImportFeedback({
  preview,
  previewPending,
  error,
  setupHref,
  importResult,
}: Pick<BankTransactionImportProps, "preview" | "previewPending" | "error" | "setupHref" | "importResult">) {
  return (
    <>
      {preview ? (
        <Alert title="Confirm destination account">
          <Text>
            IBAN <code>{preview.accountIban}</code>
          </Text>
          <Text>
            {preview.account.displayName} · {preview.account.legalEntity.name}
          </Text>
          <Text>Total CSV rows: {preview.total}</Text>
          <Text>New entries: {preview.inserted}</Text>
          <Text>Duplicates ignored: {preview.skipped}</Text>
        </Alert>
      ) : null}
      {previewPending ? <Text role="status">Reading and checking CSV…</Text> : null}
      {error ? <Alert color="red">{error}</Alert> : null}
      {setupHref ? <Anchor href={setupHref}>Set up bank accounts in Legal entities</Anchor> : null}
      {importResult && (
        <Alert variant="light" color="green">
          IBAN <code>{importResult.accountIban}</code>: imported {importResult.inserted} new entries, skipped{" "}
          {importResult.skipped} duplicates (total rows {importResult.total}).
        </Alert>
      )}
    </>
  )
}
