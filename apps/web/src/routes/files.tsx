import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import {
  Cloud,
  File,
  FileImage,
  FileText,
  HardDrive,
  Loader2,
  Music,
  Trash2,
  Upload,
  Video,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { Badge } from "@prive-admin-tanstack/ui/components/badge"
import { Button } from "@prive-admin-tanstack/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prive-admin-tanstack/ui/components/card"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prive-admin-tanstack/ui/components/table"
import type { FileItem } from "@/functions/files"
import { deleteFile, getUploadUrl, listFiles } from "@/functions/files"
import { getUser } from "@/functions/get-user"

export const Route = createFileRoute("/files")({
  component: FilesPage,
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDate(iso: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext))
    return <FileImage className="size-4 text-primary" />
  if (["mp4", "webm", "mov", "avi"].includes(ext))
    return <Video className="size-4 text-primary" />
  if (["mp3", "wav", "ogg", "flac"].includes(ext))
    return <Music className="size-4 text-primary" />
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext))
    return <FileText className="size-4 text-primary" />
  return <File className="size-4 text-primary" />
}

interface UploadProgress {
  fileName: string
  progress: number
  status: "uploading" | "done" | "error"
}

function FilesPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const { data: files, isLoading } = useQuery({
    queryKey: ["files"],
    queryFn: () => listFiles(),
  })

  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteFile({ data: { key } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files"] }),
  })

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
            const { url } = await getUploadUrl({
              data: { fileName: file.name, contentType: file.type || "application/octet-stream" },
            })

            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest()
              xhr.open("PUT", url)
              xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream")

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
                if (xhr.status >= 200 && xhr.status < 300) {
                  setUploads((prev) =>
                    prev.map((u, idx) =>
                      idx === i ? { ...u, progress: 100, status: "done" } : u,
                    ),
                  )
                  resolve()
                } else {
                  reject(new Error(`Upload failed: ${xhr.status}`))
                }
              }

              xhr.onerror = () => reject(new Error("Network error"))
              xhr.send(file)
            })
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

      // Clear completed uploads after a delay
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
      if (e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files)
      }
    },
    [uploadFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const totalSize = files?.reduce((sum, f) => sum + f.size, 0) ?? 0

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Cloud className="size-4" />
            <span className="text-xs uppercase tracking-widest">Files</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            File Storage
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage files on Cloudflare R2.
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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
              or click to browse &middot; any file type
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
                    <p className="truncate text-xs font-medium">{upload.fileName}</p>
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

      {/* File list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-3.5 text-primary" />
            Stored Files
          </CardTitle>
          <CardDescription>Files in the uploads directory</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="ml-auto h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : !files?.length ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Cloud className="size-8 opacity-40" />
              <p className="text-sm">No files uploaded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-24 text-right">Size</TableHead>
                  <TableHead className="w-36 text-right">Modified</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <FileRow
                    key={file.key}
                    file={file}
                    onDelete={() => deleteMutation.mutate(file.key)}
                    isDeleting={
                      deleteMutation.isPending &&
                      deleteMutation.variables === file.key
                    }
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FileRow({
  file,
  onDelete,
  isDeleting,
}: {
  file: FileItem
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          {fileIcon(file.name)}
          <span className="truncate text-xs font-medium">{file.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-right text-[0.625rem] text-muted-foreground">
        {formatBytes(file.size)}
      </TableCell>
      <TableCell className="text-right text-[0.625rem] text-muted-foreground">
        {formatDate(file.lastModified)}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDelete}
          disabled={isDeleting}
          className="text-muted-foreground hover:text-destructive"
        >
          {isDeleting ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Trash2 className="size-3" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  )
}
