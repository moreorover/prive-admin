import {
  ActionIcon,
  Badge,
  FileInput,
  Group,
  Popover,
  Select,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core"
import { IconLinkOff, IconPaperclip, IconTrash } from "@tabler/icons-react"

type AttachmentOption = {
  id: string
  originalName: string
  contentType: string
}

export function AttachmentsCell({
  opened,
  count,
  attachments,
  attachmentsLoading,
  unassignedAttachments,
  assignLoading,
  removeLoading,
  unassignLoading,
  uploadLoading,
  onOpenChange,
  onPreview,
  onAssign,
  onRemove,
  onUnassign,
  onUpload,
}: {
  opened: boolean
  count: number
  attachments: AttachmentOption[]
  attachmentsLoading: boolean
  unassignedAttachments: AttachmentOption[]
  assignLoading: boolean
  removeLoading: boolean
  unassignLoading: boolean
  uploadLoading: boolean
  onOpenChange: (opened: boolean) => void
  onPreview: (a: AttachmentOption) => void
  onAssign: (attachmentId: string) => void
  onRemove: (attachmentId: string) => void
  onUnassign: (attachmentId: string) => void
  onUpload: (file: File) => void
}) {
  return (
    <Popover opened={opened} onChange={onOpenChange} position="left" withArrow shadow="md" width={360}>
      <Popover.Target>
        <Tooltip label={count > 0 ? `${count} file${count === 1 ? "" : "s"}` : "Add file"} withArrow>
          <ActionIcon variant={count > 0 ? "light" : "subtle"} onClick={() => onOpenChange(!opened)} aria-label="Files">
            {count > 0 ? (
              <Badge size="sm" variant="filled" circle>
                {count}
              </Badge>
            ) : (
              <IconPaperclip size={16} />
            )}
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text fw={500} size="sm">
            Attachments
          </Text>
          {opened && attachmentsLoading && (
            <Text size="xs" c="dimmed">
              Loading...
            </Text>
          )}
          {attachments.map((a) => (
            <Group key={a.id} justify="space-between" wrap="nowrap" gap="xs">
              <UnstyledButton
                onClick={() => {
                  onOpenChange(false)
                  onPreview(a)
                }}
                style={{ textAlign: "left", flex: 1, minWidth: 0 }}
              >
                <Text size="xs" td="underline" style={{ wordBreak: "break-all" }}>
                  {a.originalName}
                </Text>
              </UnstyledButton>
              <Group gap={4} wrap="nowrap">
                <Tooltip label="Unassign" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => onUnassign(a.id)}
                    loading={unassignLoading}
                    aria-label="Unassign"
                  >
                    <IconLinkOff size={14} />
                  </ActionIcon>
                </Tooltip>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={() => onRemove(a.id)}
                  loading={removeLoading}
                  aria-label="Delete"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Group>
          ))}
          {opened && attachments.length === 0 && (
            <Text size="xs" c="dimmed">
              No files yet.
            </Text>
          )}
          {unassignedAttachments.length > 0 && (
            <Select
              placeholder="Attach existing..."
              size="xs"
              searchable
              data={unassignedAttachments.map((a) => ({ value: a.id, label: a.originalName }))}
              value={null}
              onChange={(v) => {
                if (v) onAssign(v)
              }}
              disabled={assignLoading}
              comboboxProps={{ withinPortal: false }}
            />
          )}
          <FileInput
            placeholder="Upload new"
            size="xs"
            disabled={uploadLoading}
            value={null}
            onChange={(f) => {
              if (f) onUpload(f)
            }}
          />
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
