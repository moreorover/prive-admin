import {
  ActionIcon,
  Avatar,
  Group,
  Menu,
  Text,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core"
import { IconChevronDown, IconDeviceDesktop, IconLogout, IconMoon, IconSun, IconUserCircle } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"

import { Route } from "../route"
import classes from "../route.module.css"

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      aria-label={`Color scheme: ${colorScheme}. Click to switch to ${next}.`}
      onClick={() => setColorScheme(next)}
    >
      <Icon size={18} />
    </ActionIcon>
  )
}

export function UserSection() {
  const navigate = Route.useNavigate()
  const theme = useMantineTheme()
  const { session } = Route.useRouteContext()
  const [menuOpened, setMenuOpened] = useState(false)

  const user = session.user
  const triggerClass = `${classes.user}${menuOpened ? ` ${classes.userActive}` : ""}`

  return (
    <Menu
      width={260}
      position="bottom-end"
      transitionProps={{ transition: "pop-top-right" }}
      onOpen={() => setMenuOpened(true)}
      onClose={() => setMenuOpened(false)}
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton className={triggerClass} aria-label="Open user menu">
          <Group gap={7} wrap="nowrap">
            <Avatar radius="xl" size={24} color="initials" name={user.name} />
            <Text fw={500} size="sm" lh={1} mr={3} visibleFrom="sm">
              {user.name}
            </Text>
            <IconChevronDown size={12} stroke={1.5} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>My account</Menu.Label>
        <Menu.Item disabled leftSection={<IconUserCircle size={16} color={theme.colors.champagne[6]} stroke={1.5} />}>
          {user.email}
        </Menu.Item>
        <Menu.Item
          renderRoot={(props) => <Link to="/profile" {...props} />}
          leftSection={<IconUserCircle size={16} stroke={1.5} />}
        >
          Profile settings
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
