import { Alert, Anchor, Button, Card, FileInput, Group, Modal, Paper, SimpleGrid, Stack, Text } from "@mantine/core"

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
      <Text size="sm" c="dimmed">
        Upload an SEB or Swedbank CSV, then review the destination account and entries before confirming the import.
      </Text>
      <FileInput
        disabled={importPending}
        label="Bank statement CSV"
        placeholder="Pick a .csv file"
        value={file}
        onChange={onFileChange}
        accept=".csv,text/csv"
        w="100%"
      />
      <BankStatementImportFeedback
        preview={preview}
        previewPending={previewPending}
        error={error}
        setupHref={setupHref}
        importResult={importResult}
      />
      <Group justify="flex-end" gap="xs" pt="xs">
        {onCancel ? (
          <Button variant="default" onClick={onCancel} disabled={importPending}>
            {importResult ? "Close" : "Cancel"}
          </Button>
        ) : null}
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
      </Group>
    </Stack>
  )
  return opened !== undefined ? (
    <Modal
      opened={opened}
      onClose={onCancel ?? (() => {})}
      title="Import bank statement CSV"
      size="lg"
      centered
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
        <Paper withBorder radius="md" p="md">
          <Stack gap="sm">
            <SimpleGrid component="dl" cols={1} spacing="sm" m={0}>
              <div>
                <Text component="dt" size="xs" c="dimmed">
                  Import to
                </Text>
                <Text component="dd" size="sm" fw={500} m={0} style={{ overflowWrap: "anywhere" }}>
                  {preview.account.displayName} ·{" "}
                  <Text component="span" ff="monospace" size="sm">
                    {preview.accountIban}
                  </Text>{" "}
                  · {preview.account.legalEntity.name}
                </Text>
              </div>
            </SimpleGrid>
            <SimpleGrid
              component="dl"
              cols={3}
              spacing="xs"
              m={0}
              pt="sm"
              style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
            >
              <div>
                <Text component="dt" size="xs" c="dimmed">
                  Total CSV rows
                </Text>
                <Text component="dd" size="lg" fw={600} m={0}>
                  {preview.total}
                </Text>
              </div>
              <div>
                <Text component="dt" size="xs" c="dimmed">
                  New entries
                </Text>
                <Text component="dd" size="lg" fw={600} m={0}>
                  {preview.inserted}
                </Text>
              </div>
              <div>
                <Text component="dt" size="xs" c="dimmed">
                  Duplicates ignored
                </Text>
                <Text component="dd" size="lg" fw={600} m={0}>
                  {preview.skipped}
                </Text>
              </div>
            </SimpleGrid>
          </Stack>
        </Paper>
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
