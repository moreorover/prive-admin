import { Badge, type BadgeProps } from "@mantine/core"

const statusColors: Record<string, string> = {
  active: "teal",
  assigned: "teal",
  completed: "green",
  ignored: "gray",
  inactive: "gray",
  pending: "yellow",
  processing: "blue",
  rejected: "red",
  failed: "red",
  unassigned: "orange",
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split(/[_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function StatusBadge({ status, ...props }: { status: string } & Omit<BadgeProps, "children">) {
  const normalizedStatus = status.toLowerCase()

  return (
    <Badge color={statusColors[normalizedStatus] ?? "gray"} variant="light" {...props}>
      {formatStatus(status)}
    </Badge>
  )
}
