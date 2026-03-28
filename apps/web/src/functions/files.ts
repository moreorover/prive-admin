import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

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
    try {
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
    } catch (error) {
      console.error("[listFiles]", error)
      throw new Error("Failed to list files")
    }
  })

export const deleteFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ key: z.string().min(1) }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: data.key,
      })
      await r2.send(command)
      return { success: true }
    } catch (error) {
      console.error("[deleteFile]", error)
      throw new Error("Failed to delete file")
    }
  })

// ── Presigned URL upload ────────────────────────────────────────────

export const getUploadUrl = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ fileName: z.string().min(1), contentType: z.string().min(1) }))
  .handler(async ({ data }): Promise<{ url: string; key: string }> => {
    try {
      const key = `uploads/${Date.now()}-${data.fileName}`
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: data.contentType,
      })
      const url = await getSignedUrl(r2, command, { expiresIn: 600 })
      return { url, key }
    } catch (error) {
      console.error("[getUploadUrl]", error)
      throw new Error("Failed to generate upload URL")
    }
  })

export const confirmUpload = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ key: z.string().min(1) }))
  .handler(async ({ data }): Promise<FileItem> => {
    try {
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
    } catch (error) {
      console.error("[confirmUpload]", error)
      throw new Error("Failed to confirm upload")
    }
  })
