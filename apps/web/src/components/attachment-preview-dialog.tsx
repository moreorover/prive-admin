import { Anchor, Button, Group, Modal, Stack, Text } from "@mantine/core"

export type AttachmentPreview = {
  id: string
  originalName: string
  contentType: string
}

export function AttachmentPreviewDialog({
  attachment,
  onClose,
}: {
  attachment: AttachmentPreview | null
  onClose: () => void
}) {
  const opened = attachment !== null
  const previewUrl = attachment ? `/api/statement-attachments/preview?id=${encodeURIComponent(attachment.id)}` : ""

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      zIndex={400}
      title={
        attachment && (
          <Group gap="sm">
            <Text fw={500} style={{ wordBreak: "break-all" }}>
              {attachment.originalName}
            </Text>
            <Anchor href={previewUrl} download={attachment.originalName} size="xs">
              Download
            </Anchor>
          </Group>
        )
      }
    >
      {attachment && <PreviewBody attachment={attachment} previewUrl={previewUrl} />}
    </Modal>
  )
}

function PreviewBody({ attachment, previewUrl }: { attachment: AttachmentPreview; previewUrl: string }) {
  const contentType = attachment.contentType || ""

  if (contentType === "application/pdf") {
    return (
      <iframe
        title={attachment.originalName}
        src={previewUrl}
        sandbox=""
        style={{ width: "100%", height: "75vh", border: 0 }}
      />
    )
  }

  if (contentType.startsWith("image/")) {
    return (
      <img
        alt={attachment.originalName}
        src={previewUrl}
        style={{ maxWidth: "100%", maxHeight: "75vh", display: "block", margin: "0 auto" }}
      />
    )
  }

  if (contentType.startsWith("text/")) {
    return (
      <iframe
        title={attachment.originalName}
        src={previewUrl}
        sandbox=""
        style={{ width: "100%", height: "75vh", border: 0 }}
      />
    )
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Cannot preview this file type ({contentType || "unknown"}).
      </Text>
      <Button component="a" href={previewUrl} download={attachment.originalName} variant="default">
        Download
      </Button>
    </Stack>
  )
}
