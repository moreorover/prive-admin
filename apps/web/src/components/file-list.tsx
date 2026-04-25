import { ActionIcon, Card, Center, Group, Loader, Skeleton, Stack, Table, Text, Title } from "@mantine/core"
import {
  IconCloud,
  IconFile,
  IconFileText,
  IconMusic,
  IconPhoto,
  IconTrash,
  IconVideo,
} from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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
    timeZone: "UTC",
  })
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext)) return <IconPhoto size={16} />
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return <IconVideo size={16} />
  if (["mp3", "wav", "ogg", "flac"].includes(ext)) return <IconMusic size={16} />
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) return <IconFileText size={16} />
  return <IconFile size={16} />
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

  return { files, isLoading, totalSize, deleteMutation }
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
    <Card withBorder>
      <Title order={4} mb="sm">
        Stored Files
      </Title>
      <Text size="xs" c="dimmed" mb="md">
        Files in the uploads directory
      </Text>
      {isLoading ? (
        <Stack gap="xs">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} h={20} />
          ))}
        </Stack>
      ) : !files?.length ? (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <IconCloud size={32} />
            <Text size="sm" c="dimmed">
              No files uploaded yet
            </Text>
          </Stack>
        </Center>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th ta="right">Size</Table.Th>
              <Table.Th ta="right">Modified</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {files.map((file) => (
              <FileRow
                key={file.key}
                file={file}
                onDelete={() => deleteMutation.mutate(file.key)}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === file.key}
              />
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}

function FileRow({ file, onDelete, isDeleting }: { file: FileItem; onDelete: () => void; isDeleting: boolean }) {
  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="xs">
          {fileIcon(file.name)}
          <Text size="sm">{file.name}</Text>
        </Group>
      </Table.Td>
      <Table.Td ta="right" c="dimmed">
        <Text size="xs">{formatBytes(file.size)}</Text>
      </Table.Td>
      <Table.Td ta="right" c="dimmed">
        <Text size="xs">{formatDate(file.lastModified)}</Text>
      </Table.Td>
      <Table.Td>
        <ActionIcon variant="subtle" color="red" onClick={onDelete} disabled={isDeleting} aria-label="Delete file">
          {isDeleting ? <Loader size={12} /> : <IconTrash size={14} />}
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  )
}
