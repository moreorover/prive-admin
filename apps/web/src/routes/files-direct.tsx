import { createFileRoute, redirect } from "@tanstack/react-router"
import { Cloud, HardDrive, Upload } from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { Badge } from "@prive-admin-tanstack/ui/components/badge"
import { Button } from "@prive-admin-tanstack/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@prive-admin-tanstack/ui/components/card"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import { FileListCard, formatBytes, useFiles } from "@/components/file-list"
import { confirmUpload, getUploadUrl } from "@/functions/files"
import { getUser } from "@/functions/get-user"

export const Route = createFileRoute("/files-direct")({
  component: FilesDirectPage,
  beforeLoad: async () => {
    const session = await getUser()
    return { session }
  },
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" })
    }
  },
})

interface UploadProgress {
  fileName: string
  progress: number
  status: "uploading" | "confirming" | "done" | "error"
}

function FilesDirectPage() {
  const { files, isLoading, totalSize, deleteMutation, queryClient } = useFiles()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const filesToUpload = Array.from(fileList)

      const newUploads: UploadProgress[] = filesToUpload.map((f) => ({
        fileName: f.name,
        progress: 0,
        status: "uploading",
      }))
      setUploads((prev) => [...newUploads, ...prev])

      await Promise.allSettled(
        filesToUpload.map(async (file, i) => {
          try {
            // 1. Get presigned URL from server
            const { url, key } = await getUploadUrl({
              data: {
                fileName: file.name,
                contentType: file.type || "application/octet-stream",
              },
            })

            // 2. Upload directly to R2
            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest()
              xhr.open("PUT", url)
              xhr.setRequestHeader(
                "Content-Type",
                file.type || "application/octet-stream",
              )

              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  const pct = Math.round((e.loaded / e.total) * 100)
                  setUploads((prev) =>
                    prev.map((u, idx) =>
                      idx === i ? { ...u, progress: pct } : u,
                    ),
                  )
                }
              }

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) resolve()
                else reject(new Error(`Upload failed: ${xhr.status}`))
              }

              xhr.onerror = () => reject(new Error("Network error"))
              xhr.send(file)
            })

            // 3. Confirm upload with server (verify + record in DB)
            setUploads((prev) =>
              prev.map((u, idx) =>
                idx === i ? { ...u, progress: 100, status: "confirming" } : u,
              ),
            )

            await confirmUpload({ data: { key } })

            setUploads((prev) =>
              prev.map((u, idx) =>
                idx === i ? { ...u, status: "done" } : u,
              ),
            )
          } catch {
            setUploads((prev) =>
              prev.map((u, idx) =>
                idx === i ? { ...u, status: "error" } : u,
              ),
            )
          }
        }),
      )

      queryClient.invalidateQueries({ queryKey: ["files"] })
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status === "uploading"))
      }, 3000)
    },
    [queryClient],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files)
    },
    [uploadFiles],
  )

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Cloud className="size-4" />
            <span className="text-xs uppercase tracking-widest">
              Files — Direct Upload
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Presigned URL Upload
          </h1>
          <p className="text-sm text-muted-foreground">
            Files are uploaded directly to R2 via presigned URLs. Requires CORS on the bucket.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[0.625rem] text-muted-foreground">
            <HardDrive className="size-3" />
            {isLoading ? (
              <Skeleton className="h-3 w-16" />
            ) : (
              <span>
                {files?.length ?? 0} files &middot; {formatBytes(totalSize)}
              </span>
            )}
          </div>
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-3" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                uploadFiles(e.target.files)
                e.target.value = ""
              }
            }}
          />
        </div>
      </div>

      <Separator />

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative cursor-pointer rounded-lg border-2 border-dashed transition-all ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/40 hover:bg-muted/50"
        }`}
      >
        <div className="flex flex-col items-center gap-3 py-12">
          <div
            className={`rounded-full p-3 transition-colors ${
              isDragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            <Upload className="size-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-[0.625rem] text-muted-foreground">
              or click to browse &middot; direct to R2 with real progress
            </p>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Uploads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {uploads.map((upload, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-medium">
                      {upload.fileName}
                    </p>
                    <Badge
                      variant={
                        upload.status === "done"
                          ? "default"
                          : upload.status === "error"
                            ? "destructive"
                            : "outline"
                      }
                      className="ml-2 shrink-0 text-[0.5rem]"
                    >
                      {upload.status === "uploading"
                        ? `${upload.progress}%`
                        : upload.status === "confirming"
                          ? "Confirming..."
                          : upload.status === "done"
                            ? "Done"
                            : "Failed"}
                    </Badge>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        upload.status === "error" ? "bg-destructive" : "bg-primary"
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <FileListCard
        files={files}
        isLoading={isLoading}
        deleteMutation={deleteMutation}
      />
    </div>
  )
}
