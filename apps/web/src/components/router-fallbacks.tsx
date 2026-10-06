import { Button, Center, Container, Paper, Stack, Text, Title } from "@mantine/core"
import { Link } from "@tanstack/react-router"

export function NotFoundPage() {
  return (
    <Center mih="100vh" px="md">
      <Container size={480} w="100%">
        <Paper p={{ base: "xl", sm: "2.5rem" }}>
          <Stack gap="md">
            <Text c="champagne.6" fw={800} size="xs" tt="uppercase" lts="0.12em">
              Privé / 404
            </Text>
            <Title order={1}>That page has moved.</Title>
            <Text c="dimmed">
              The address is no longer available, or it may have been entered incorrectly. Return to the dashboard to
              continue working.
            </Text>
            <Button component={Link} to="/" w="fit-content">
              Back to dashboard
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Center>
  )
}
