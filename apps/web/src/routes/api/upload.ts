import { PutObjectCommand } from "@aws-sdk/client-s3"
import { auth } from "@prive-admin-tanstack/auth"
import { createFileRoute } from "@tanstack/react-router"

import { bucketName, r2 } from "@/lib/r2"

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        }

        console.log("[upload] POST from", session.user.email)

        const formData = await request.formData()
        const file = formData.get("file") as globalThis.File | null
        if (!file) {
          return new Response(JSON.stringify({ error: "No file provided" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        console.log("[upload] file:", file.name, "size:", file.size, "type:", file.type)

        try {
          const key = `uploads/${Date.now()}-${file.name}`
          const arrayBuffer = await file.arrayBuffer()

          const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: new Uint8Array(arrayBuffer),
            ContentType: file.type || "application/octet-stream",
          })

          console.log("[upload] sending to R2, key:", key)
          await r2.send(command)
          console.log("[upload] complete")

          return new Response(JSON.stringify({ key }), {
            headers: { "Content-Type": "application/json" },
          })
        } catch (error) {
          console.error("[upload]", error)
          return new Response(JSON.stringify({ error: "Upload failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        }
      },
    },
  },
})
