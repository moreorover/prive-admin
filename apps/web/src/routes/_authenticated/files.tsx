import { Badge, Box, Button, Card, Container, Divider, Group, Progress, Skeleton, Stack, Text, Title } from "@mantine/core"
import { IconCloud, IconUpload } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useRef, useState } from "react"

import { FileListCard, filesQueryOptions, formatBytes, useFiles } from "@/components/file-list"
import { fileKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/files")({
  component: FilesProxyPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(filesQueryOptions)
  },
})

interface UploadProgress {
  fileName: string
  progress: number
  status: "uploading" | "done" | "error"
}

function uploadFileViaProxy(file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append("file", file)
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed: ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error("Network error"))
    xhr.send(formData)
  })
}

function FilesProxyPage() {
  const { files, isLoading, totalSize, deleteMutation } = useFiles()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const uploadMutation = useMutation({
    mutationKey: ["files", "upload-proxy"],
    mutationFn: async (fileList: File[]) => {
      const newUploads: UploadProgress[] = fileList.map((f) => ({ fileName: f.name, progress: 0, status: "uploading" }))
      setUploads((prev) => [...newUploads, ...prev])
      await Promise.allSettled(
        fileList.map(async (file, i) => {
          try {
            await uploadFileViaProxy(file, (pct) => {
              setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, progress: pct } : u)))
            })
            setUploads((prev) =>
              prev.map((u, idx) => (idx === i ? { ...u, progress: 100, status: "done" } : u)),
            )
          } catch {
            setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, status: "error" } : u)))
          }
        }),
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all })
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status === "uploading"))
      }, 3000)
    },
  })

  const uploadFiles = (fileList: FileList | File[]) => {
    uploadMutation.mutate(Array.from(fileList))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files)
  }

  return (
    <Container size="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase">
              Files — Server Proxy
            </Text>
            <Title order={2}>Server Proxy Upload</Title>
            <Text size="sm" c="dimmed">
              Files are sent through the server to R2. No CORS needed.
            </Text>
          </Stack>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              {isLoading ? <Skeleton h={12} w={80} /> : `${files?.length ?? 0} files · ${formatBytes(totalSize)}`}
            </Text>
            <Button
              size="sm"
              leftSection={<IconUpload size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) {
                  uploadFiles(e.target.files)
                  e.target.value = ""
                }
              }}
            />
          </Group>
        </Group>

        <Divider />

        <Box
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--mantine-color-default-border)",
            borderRadius: "var(--mantine-radius-md)",
            padding: "var(--mantine-spacing-xl)",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging ? "var(--mantine-color-default-hover)" : undefined,
          }}
        >
          <Stack align="center" gap="xs">
            <IconCloud size={32} />
            <Text size="sm">{isDragging ? "Drop files here" : "Drag & drop files here"}</Text>
            <Text size="xs" c="dimmed">
              or click to browse · proxied through server
            </Text>
          </Stack>
        </Box>

        {uploads.length > 0 && (
          <Card withBorder>
            <Title order={5} mb="sm">
              Uploads
            </Title>
            <Stack gap="xs">
              {uploads.map((upload, i) => (
                <Stack key={i} gap={4}>
                  <Group justify="space-between">
                    <Text size="xs" truncate>
                      {upload.fileName}
                    </Text>
                    <Badge
                      size="sm"
                      color={upload.status === "done" ? "green" : upload.status === "error" ? "red" : undefined}
                      variant={upload.status === "uploading" ? "outline" : "light"}
                    >
                      {upload.status === "uploading"
                        ? `${upload.progress}%`
                        : upload.status === "done"
                          ? "Done"
                          : "Failed"}
                    </Badge>
                  </Group>
                  <Progress
                    value={upload.progress}
                    color={upload.status === "error" ? "red" : undefined}
                    size="xs"
                  />
                </Stack>
              ))}
            </Stack>
          </Card>
        )}

        <FileListCard files={files} isLoading={isLoading} deleteMutation={deleteMutation} />
      </Stack>
    </Container>
  )
}
