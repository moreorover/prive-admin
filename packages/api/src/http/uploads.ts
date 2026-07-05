import { PutObjectCommand } from "@aws-sdk/client-s3"
import { Hono } from "hono"

import { bucketName, r2 } from "../r2"
import { requireSession } from "./session"

export const uploadRoutes = new Hono()

uploadRoutes.post("/upload", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const formData = await c.req.raw.formData()
  const file = formData.get("file") as globalThis.File | null
  if (!file) return c.json({ error: "No file provided" }, 400)

  try {
    const safeName = file.name.replace(/[^\w.-]+/g, "_")
    const key = `uploads/${Date.now()}-${safeName}`
    const arrayBuffer = await file.arrayBuffer()
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type || "application/octet-stream",
      }),
    )
    return c.json({ key })
  } catch (error) {
    console.error("[upload]", error)
    return c.json({ error: "Upload failed" }, 500)
  }
})
