import {
  ActionIcon,
  Avatar,
  Button,
  Container,
  Group,
  Menu,
  Skeleton,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core"
import { IconChevronDown, IconDeviceDesktop, IconLogout, IconMoon, IconSun, IconUserCircle } from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"

import { authClient } from "@/lib/auth-client"

const links = [
  { to: "/", label: "Home" },
  { to: "/playground", label: "Playground" },
  { to: "/files", label: "Files (Proxy)" },
  { to: "/files-direct", label: "Files (Direct)" },
] as const

export default function Header() {
  return (
    <Container size="lg" py="sm">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md">
          {links.map(({ to, label }) => (
            <Button key={to} component={Link} to={to} variant="subtle" size="sm">
              {label}
            </Button>
          ))}
        </Group>
        <Group gap="xs" wrap="nowrap">
          <ColorSchemeToggle />
          <UserSection />
        </Group>
      </Group>
    </Container>
  )
}

function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <ActionIcon
      variant="default"
      size="lg"
      aria-label={`Color scheme: ${colorScheme}. Click to switch to ${next}.`}
      onClick={() => setColorScheme(next)}
    >
      <Icon size={18} />
    </ActionIcon>
  )
}

function UserSection() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <Skeleton height={28} width={140} />
  }

  if (!session) {
    return (
      <Button component={Link} to="/login" variant="default" size="sm">
        Sign In
      </Button>
    )
  }

  const user = session.user

  return (
    <Menu width={260} position="bottom-end" withinPortal>
      <Menu.Target>
        <UnstyledButton>
          <Group gap={7} wrap="nowrap">
            <Avatar radius="xl" size={20} color="initials" name={user.name} />
            <Text fw={500} size="sm" lh={1} mr={3}>
              {user.name}
            </Text>
            <IconChevronDown size={12} stroke={1.5} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>My account</Menu.Label>
        <Menu.Item disabled leftSection={<IconUserCircle size={16} stroke={1.5} />}>
          {user.email}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} stroke={1.5} />}
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  navigate({ to: "/" })
                },
              },
            })
          }
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
