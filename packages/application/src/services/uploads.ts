import type { ObjectStorage } from "./storage"

export async function storeUpload(input: {
  prefix: string
  fileName: string
  contentType: string
  body: Uint8Array
  storage: ObjectStorage
}) {
  const safeName = input.fileName.replace(/[^\w.-]+/g, "_")
  const key = `${input.prefix}/${Date.now()}-${safeName}`
  await input.storage.putObject({ key, body: input.body, contentType: input.contentType })
  return { key }
}
