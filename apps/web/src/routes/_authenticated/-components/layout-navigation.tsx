import { Burger, Drawer, Group, Stack, Title } from "@mantine/core"

import { appNavGroups, flatAppNavItems } from "@/lib/app-navigation"

import classes from "../route.module.css"
import { DrawerNavGroup, NavLinkButton } from "./nav-link-button"
import { ColorSchemeToggle, UserSection } from "./user-controls"

export function HeaderTop({ opened, onToggle }: { opened: boolean; onToggle: () => void }) {
  return (
    <Group className={classes.topRow} px="lg" justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <Burger opened={opened} onClick={onToggle} hiddenFrom="lg" size="sm" aria-label="Toggle navigation" />
        <Title order={4} fw={600} className={classes.brand}>
          Privé
        </Title>
      </Group>
      <Group gap="xs" wrap="nowrap">
        <ColorSchemeToggle />
        <UserSection />
      </Group>
    </Group>
  )
}

export function DesktopTabs({ badges }: { badges: { unassigned: number } }) {
  return (
    <Group className={classes.tabsRow} px="lg" gap={2} wrap="nowrap">
      {flatAppNavItems.map((item) => (
        <NavLinkButton key={item.to} item={item} badge={item.badgeKey ? badges[item.badgeKey] : 0} variant="desktop" />
      ))}
    </Group>
  )
}

export function MobileNavigationDrawer({
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
