import type { ObjectStorage } from "@prive-admin-tanstack/application/services"

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { Readable } from "node:stream"

import { bucketName, r2 } from "./r2"

export const r2Storage: ObjectStorage = {
  async putObject(input: { key: string; body: Uint8Array; contentType: string }) {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    )
  },
  async getObject(input: { key: string }) {
    const result = await r2.send(new GetObjectCommand({ Bucket: bucketName, Key: input.key }))
    return { body: result.Body ? (result.Body as Readable) : null, contentType: result.ContentType ?? null }
  },
  async deleteObject(input: { key: string }) {
    await r2.send(new DeleteObjectCommand({ Bucket: bucketName, Key: input.key }))
  },
}
