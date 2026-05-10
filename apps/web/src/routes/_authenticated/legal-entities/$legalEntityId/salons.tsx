import { Text } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/salons")({
  component: () => <Text c="dimmed">Coming soon</Text>,
})
