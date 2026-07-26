import { Badge, Box, Group, Stack, Text, UnstyledButton } from "@mantine/core"
import { Link, useLocation } from "@tanstack/react-router"

import type { AppNavItem } from "@/lib/app-navigation"

import classes from "../route.module.css"

export function DrawerNavGroup({
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

export function NavLinkButton({
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
          {variant === "drawer" ? <Icon size={18} stroke={1.6} className={classes.navLinkIcon} /> : null}
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
