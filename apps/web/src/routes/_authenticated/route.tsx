import type { ErrorComponentProps } from "@tanstack/react-router"

import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Box,
  Burger,
  Button,
  Card,
  Drawer,
  Group,
  Menu,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
  IconAlertCircle,
  IconChevronDown,
  IconDeviceDesktop,
  IconLogout,
  IconMoon,
  IconRefresh,
  IconSun,
  IconUserCircle,
} from "@tabler/icons-react"
import { useQuery, useQueryErrorResetBoundary } from "@tanstack/react-query"
import { Link, Outlet, createFileRoute, redirect, useLocation, useNavigate, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { appNavGroups, flatAppNavItems, getActiveAppNavItem, type AppNavItem } from "@/lib/app-navigation"
import { authClient } from "@/lib/auth-client"
import { trpc } from "@/utils/trpc"

import classes from "./route.module.css"

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  errorComponent: AuthenticatedErrorComponent,
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession()
    if (session.error) {
      throw new Error(session.error.message || "Failed to load session")
    }
    if (!session.data) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
    return { session: session.data }
  },
})

function AuthenticatedLayout() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false)
  const location = useLocation()

  const { data: unassignedAttachments = [] } = useQuery(
    trpc.bankStatementAttachments.list.queryOptions({ assigned: false }),
  )
  const badges = { unassigned: unassignedAttachments.length }
  const activeItem = getActiveAppNavItem(location.pathname)
  const activeBadge = activeItem?.badgeKey ? badges[activeItem.badgeKey] : 0

  return (
    <AppShell header={{ height: { base: 64, lg: 112 } }} padding={0}>
      <AppShell.Header className={classes.header}>
        <HeaderTop opened={mobileOpened} onToggle={toggleMobile} />
        <DesktopTabs badges={badges} />
        <LedgerRule activeLabel={activeItem?.label ?? "Admin"} activeBadge={activeBadge} />
      </AppShell.Header>
      <MobileNavigationDrawer opened={mobileOpened} onClose={closeMobile} badges={badges} />

      <AppShell.Main className={classes.main}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

function HeaderTop({ opened, onToggle }: { opened: boolean; onToggle: () => void }) {
  return (
    <Group className={classes.topRow} px="lg" justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <Burger opened={opened} onClick={onToggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
        <Title order={4} fw={600} className={classes.brand}>
          Privé
        </Title>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" visibleFrom="sm">
          Atelier Ledger
        </Text>
      </Group>
      <Group gap="xs" wrap="nowrap">
        <ColorSchemeToggle />
        <UserSection />
      </Group>
    </Group>
  )
}

function DesktopTabs({ badges }: { badges: { unassigned: number } }) {
  return (
    <Group className={classes.tabsRow} px="lg" gap={2} wrap="nowrap">
      {flatAppNavItems.map((item) => (
        <NavLinkButton key={item.to} item={item} badge={item.badgeKey ? badges[item.badgeKey] : 0} variant="desktop" />
      ))}
    </Group>
  )
}

function LedgerRule({ activeLabel, activeBadge }: { activeLabel: string; activeBadge: number }) {
  return (
    <Group className={classes.ledgerRule} px="lg" gap="xs" wrap="nowrap">
      <Text size="xs" fw={700} tt="uppercase">
        {activeLabel}
      </Text>
      {activeBadge > 0 ? (
        <Badge size="xs" variant="light" color="yellow">
          {activeBadge}
        </Badge>
      ) : null}
    </Group>
  )
}

function MobileNavigationDrawer({
  opened,
  onClose,
  badges,
}: {
  opened: boolean
  onClose: () => void
  badges: { unassigned: number }
}) {
  return (
    <Drawer opened={opened} onClose={onClose} title="Privé" size="xs" padding="md">
      <Stack gap="lg">
        {appNavGroups.map((group) => (
          <DrawerNavGroup key={group.label} label={group.label} items={group.items} badges={badges} onClose={onClose} />
        ))}
      </Stack>
    </Drawer>
  )
}

function DrawerNavGroup({
  label,
  items,
  badges,
  onClose,
}: {
  label: string
  items: AppNavItem[]
  badges: { unassigned: number }
  onClose: () => void
}) {
  return (
    <Box>
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={6}>
        {label}
      </Text>
      <Stack gap={2}>
        {items.map((item) => (
          <NavLinkButton
            key={item.to}
            item={item}
            badge={item.badgeKey ? badges[item.badgeKey] : 0}
            variant="drawer"
            onNavigate={onClose}
          />
        ))}
      </Stack>
    </Box>
  )
}

function NavLinkButton({
  item,
  badge,
  variant,
  onNavigate,
}: {
  item: AppNavItem
  badge: number
  variant: "desktop" | "drawer"
  onNavigate?: () => void
}) {
  const location = useLocation()
  const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  const Icon = item.icon

  return (
    <UnstyledButton
      component={Link}
      to={item.to}
      onClick={onNavigate}
      data-active={active || undefined}
      className={variant === "desktop" ? classes.desktopNavLink : classes.drawerNavLink}
    >
      <Group gap="sm" wrap="nowrap" justify="space-between">
        <Group gap="sm" wrap="nowrap">
          <Icon size={18} stroke={1.6} className={classes.navLinkIcon} />
          <Text size="sm" fw={500}>
            {variant === "desktop" ? (item.shortLabel ?? item.label) : item.label}
          </Text>
        </Group>
        {badge > 0 ? (
          <Badge size="xs" variant="filled" color="yellow" circle>
            {badge}
          </Badge>
        ) : null}
      </Group>
    </UnstyledButton>
  )
}

function ColorSchemeToggle() {
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

function UserSection() {
  const navigate = useNavigate()
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
        <UnstyledButton className={triggerClass}>
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

function AuthenticatedErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  const handleRetry = () => {
    queryErrorResetBoundary.reset()
    reset()
    router.invalidate()
  }

  return (
    <Box p="md">
      <Card maw={420} mx="auto" mt="xl" p="lg">
        <Group gap="xs" mb="xs">
          <IconAlertCircle size={16} color="var(--mantine-color-red-6)" />
          <Text fw={500}>Something went wrong</Text>
        </Group>
        <Text size="sm" c="dimmed" mb="md">
          {error.message || "An unexpected error occurred."}
        </Text>
        <Button variant="default" size="sm" leftSection={<IconRefresh size={14} />} onClick={handleRetry}>
          Try again
        </Button>
      </Card>
    </Box>
  )
}
