import { PutObjectCommand } from "@aws-sdk/client-s3"

import { bucketName, r2 } from "../r2"

export async function storeUpload(input: { prefix: string; fileName: string; contentType: string; body: Uint8Array }) {
  const safeName = input.fileName.replace(/[^\w.-]+/g, "_")
  const key = `${input.prefix}/${Date.now()}-${safeName}`
  await r2.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  )
  return { key }
}
