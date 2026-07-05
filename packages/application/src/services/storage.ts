import type { Readable } from "node:stream"

export type StoredObject = {
  body: Readable | Buffer | null
  contentType?: string | null
}

export type ObjectStorage = {
  putObject(input: { key: string; body: Uint8Array; contentType: string }): Promise<void>
  getObject(input: { key: string }): Promise<StoredObject | null>
  deleteObject(input: { key: string }): Promise<void>
}
