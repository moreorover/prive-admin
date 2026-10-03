import { Alert, Button, Card, FileInput, Group, Stack, Text } from "@mantine/core"

export type BankStatementImportResult = {
  accountIban: string
  total: number
  inserted: number
  skipped: number
}

export function BankStatementImportCard({
  file,
  onFileChange,
  onImport,
  importPending,
  importResult,
}: {
  file: File | null
  onFileChange: (file: File | null) => void
  onImport: () => void
  importPending: boolean
  importResult: BankStatementImportResult | null
}) {
  return (
    <Card withBorder>
      <Stack>
        <Text fw={500}>Upload bank statement (SEB or Swedbank CSV)</Text>
        <Group align="end">
          <FileInput
            placeholder="Pick a .csv file"
            value={file}
            onChange={onFileChange}
            accept=".csv,text/csv"
            w={400}
          />
          <Button onClick={onImport} loading={importPending} disabled={!file}>
            Import
          </Button>
        </Group>
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
