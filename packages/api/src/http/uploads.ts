import { storeUpload } from "@prive-admin-tanstack/application/services"
import { Hono } from "hono"

import { r2Storage } from "../storage"
import { requireSession } from "./session"

export const uploadRoutes = new Hono()

uploadRoutes.post("/upload", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const formData = await c.req.raw.formData()
  const file = formData.get("file") as globalThis.File | null
  if (!file) return c.json({ error: "No file provided" }, 400)

  try {
    const body = new Uint8Array(await file.arrayBuffer())
    const result = await storeUpload({
      prefix: "uploads",
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      body,
      storage: r2Storage,
    })
    return c.json(result)
  } catch (error) {
    console.error("[upload]", error)
    return c.json({ error: "Upload failed" }, 500)
  }
})
