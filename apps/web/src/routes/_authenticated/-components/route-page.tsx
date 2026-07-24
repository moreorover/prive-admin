import type { ErrorComponentProps } from "@tanstack/react-router"

import { AppShell, Box, Button, Card, Group, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react"
import { useQueryErrorResetBoundary } from "@tanstack/react-query"
import { Outlet, useRouter } from "@tanstack/react-router"

import { BreadcrumbProvider } from "@/components/breadcrumbs"

import classes from "../route.module.css"
import { DesktopTabs, HeaderTop, MobileNavigationDrawer } from "./layout-navigation"

export function AuthenticatedLayout({ badges }: { badges: { unassigned: number } }) {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false)

  return (
    <BreadcrumbProvider>
      <AppShell header={{ height: { base: 64, lg: 102 } }} padding={0}>
        <AppShell.Header className={classes.header}>
          <HeaderTop opened={mobileOpened} onToggle={toggleMobile} />
          <DesktopTabs badges={badges} />
        </AppShell.Header>
        <MobileNavigationDrawer opened={mobileOpened} onClose={closeMobile} badges={badges} />

        <AppShell.Main className={classes.main}>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </BreadcrumbProvider>
  )
}

export function AuthenticatedErrorComponent({ error, reset }: ErrorComponentProps) {
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
