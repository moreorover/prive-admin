import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Cloud,
  File,
  FileImage,
  FileText,
  Loader2,
  Music,
  Trash2,
  Video,
} from "lucide-react"

import { Button } from "@prive-admin-tanstack/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prive-admin-tanstack/ui/components/card"
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
import { deleteFile, listFiles } from "@/functions/files"
import { fileKeys } from "@/lib/query-keys"

export function formatBytes(bytes: number): string {
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

export const filesQueryOptions = queryOptions({
  queryKey: fileKeys.list(),
  queryFn: () => listFiles(),
})

export function useFiles() {
  const queryClient = useQueryClient()

  const { data: files, isLoading } = useQuery(filesQueryOptions)

  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteFile({ data: { key } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fileKeys.all }),
  })

  const totalSize = files?.reduce((sum, f) => sum + f.size, 0) ?? 0

  return { files, isLoading, totalSize, deleteMutation, queryClient }
}

export function FileListCard({
  files,
  isLoading,
  deleteMutation,
}: {
  files: FileItem[] | undefined
  isLoading: boolean
  deleteMutation: ReturnType<typeof useFiles>["deleteMutation"]
}) {
  return (
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
