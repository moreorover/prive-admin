import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core"
import { IconArrowRight, IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"
import { Link, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

const services = [
  {
    number: "I",
    title: "Secure Vault",
    description: "End-to-end encrypted file management with granular access controls and audit trails.",
  },
  {
    number: "II",
    title: "Identity",
    description: "Multi-layered authentication with biometric support and session intelligence.",
  },
  {
    number: "III",
    title: "Analytics",
    description: "Real-time insights with privacy-first data processing. No external tracking.",
  },
]

function LandingPage() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <Box>
      <Container size="lg" py="md">
        <Group justify="space-between">
          <Text size="xs" c="dimmed" tt="uppercase">
            Est. 2024
          </Text>
          <Group gap="md">
            <Anchor href="#philosophy" size="xs" c="dimmed">
              Philosophy
            </Anchor>
            <Anchor href="#services" size="xs" c="dimmed">
              Services
            </Anchor>
            <Anchor href="#contact" size="xs" c="dimmed">
              Contact
            </Anchor>
            <ActionIcon variant="default" onClick={() => setColorScheme(next)} aria-label="Toggle color scheme">
              <Icon size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Container>

      <Container size="md" py="xl">
        <Stack align="center" gap="lg" mt={80} mb={120}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Exclusive Access
          </Text>
          <Title order={1} fw={300} ta="center" size={96}>
            Privé
          </Title>
          <Text c="dimmed" ta="center" maw={420}>
            Where discretion meets distinction. A private platform for those who understand that true luxury is
            invisible.
          </Text>
          <Button component="a" href="#philosophy" variant="default" rightSection={<IconArrowRight size={14} />}>
            Discover
          </Button>
        </Stack>
      </Container>

      <Container size="md" py="xl" id="philosophy">
        <Stack gap="md">
          <Text size="xs" c="dimmed" tt="uppercase">
            01 — Philosophy
          </Text>
          <Title order={2} fw={300}>
            Built for the discerning few
          </Title>
          <Text c="dimmed">
            Not everything needs to be public. Some platforms are built for visibility; ours is built for control. Every
            feature, every interaction is designed with intentional restraint — because power doesn&rsquo;t need to
            announce itself.
          </Text>
        </Stack>
      </Container>

      <Container size="lg" py="xl" id="services">
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Text size="xs" c="dimmed" tt="uppercase">
              02 — Services
            </Text>
            <Title order={2} fw={300}>
              Curated capabilities
            </Title>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {services.map((service) => (
              <Card key={service.number} withBorder padding="lg">
                <Title order={3} fw={300} c="dimmed">
                  {service.number}
                </Title>
                <Title order={4} fw={300} mt="sm">
                  {service.title}
                </Title>
                <Text c="dimmed" mt="xs" size="sm">
                  {service.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      <Container size="sm" py="xl" id="contact">
        <Stack align="center" gap="md">
          <Text size="xs" c="dimmed" tt="uppercase">
            03 — Contact
          </Text>
          <Title order={2} fw={300} ta="center">
            By invitation only
          </Title>
          <Text c="dimmed" ta="center">
            Access is granted on a referral basis. If you&rsquo;ve been given credentials, you already know how to
            proceed.
          </Text>
          <Button component={Link} to="/login" variant="default">
            Member Access
          </Button>
        </Stack>
      </Container>

      <Divider />
      <Container size="lg" py="md">
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Privé © 2024
          </Text>
          <Text size="xs" c="dimmed" tt="uppercase">
            All rights reserved
          </Text>
        </Group>
      </Container>
    </Box>
  )
}
