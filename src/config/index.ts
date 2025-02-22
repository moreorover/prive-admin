import {
  IconComponents,
  IconDashboard,
  IconLock,
  IconMoodSmile,
} from "@tabler/icons-react";
import type { NavItem } from "@/types/nav-item";

export const navLinks: NavItem[] = [
  { label: "Dashboard", icon: IconDashboard, link: "/dashboard" },
  {
    label: "Admin",
    icon: IconComponents,
    initiallyOpened: true,
    links: [
      {
        label: "Customers",
        link: "/dashboard/customers",
      },
      {
        label: "Products",
        link: "/dashboard/products",
      },
      {
        label: "Orders",
        link: "/dashboard/orders",
      },
      {
        label: "Transactions",
        link: "/dashboard/transactions",
      },
      {
        label: "Appointments",
        link: "/dashboard/appointments",
      },
    ],
  },
];
