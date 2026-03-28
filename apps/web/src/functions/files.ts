import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createServerFn } from "@tanstack/react-start"

import { bucketName, r2 } from "@/lib/r2"
import { authMiddleware } from "@/middleware/auth"

export interface FileItem {
  key: string
  name: string
  size: number
  lastModified: string
}

// ── Shared ──────────────────────────────────────────────────────────

export const listFiles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<FileItem[]> => {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "uploads/",
    })
    const response = await r2.send(command)

    return (response.Contents ?? [])
      .filter((obj) => obj.Key && obj.Key !== "uploads/")
      .map((obj) => ({
        key: obj.Key!,
        name: obj.Key!.replace("uploads/", ""),
        size: obj.Size ?? 0,
        lastModified: obj.LastModified?.toISOString() ?? "",
      }))
  })

export const deleteFile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((data: { key: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: data.key,
    })
    await r2.send(command)
    return { success: true }
  })

// ── Presigned URL upload ────────────────────────────────────────────

export const getUploadUrl = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((data: { fileName: string; contentType: string }) => data)
  .handler(async ({ data }): Promise<{ url: string; key: string }> => {
    const key = `uploads/${Date.now()}-${data.fileName}`
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: data.contentType,
    })
    const url = await getSignedUrl(r2, command, { expiresIn: 600 })
    return { url, key }
  })

export const confirmUpload = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((data: { key: string }) => data)
  .handler(async ({ data }): Promise<FileItem> => {
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: bucketName, Key: data.key }),
    )

    // TODO: record in database here
    // await db.insert(files).values({ key: data.key, ... })

    return {
      key: data.key,
      name: data.key.replace("uploads/", ""),
      size: head.ContentLength ?? 0,
      lastModified: head.LastModified?.toISOString() ?? new Date().toISOString(),
    }
  })
