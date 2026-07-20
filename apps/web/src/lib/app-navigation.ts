import {
  IconBuildingBank,
  IconCalendar,
  IconCash,
  IconLayoutDashboard,
  IconReceipt,
  IconScissors,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

export type AppNavBadgeKey = "unassigned"

export type AppNavItem = {
  to: string
  label: string
  shortLabel?: string
  icon: typeof IconUsers
  badgeKey?: AppNavBadgeKey
}

export type AppNavGroup = {
  label: "Workspace" | "Manage" | "Account"
  items: AppNavItem[]
}

export const appNavGroups: AppNavGroup[] = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
      { to: "/customers", label: "Customers", icon: IconUsers },
      { to: "/calendar", label: "Calendar", icon: IconCalendar },
      { to: "/hair-orders", label: "Hair orders", shortLabel: "Orders", icon: IconScissors },
      { to: "/hair-sales", label: "Hair sales", shortLabel: "Sales", icon: IconReceipt },
      { to: "/cash", label: "Cash", icon: IconCash },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        to: "/legal-entities",
        label: "Legal entities",
        shortLabel: "Entities",
        icon: IconBuildingBank,
        badgeKey: "unassigned",
      },
    ],
  },
  {
    label: "Account",
    items: [{ to: "/settings", label: "Settings", icon: IconSettings }],
  },
]

export const flatAppNavItems = appNavGroups.flatMap((group) => group.items)

export function getActiveAppNavItem(pathname: string) {
  return flatAppNavItems.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
}
