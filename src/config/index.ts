import type { NavItem } from "@/types/nav-item";
import { Component, LayoutDashboard } from "lucide-react";

export const navLinks: NavItem[] = [
  { label: "Dashboard", icon: Component, link: "/dashboard" },
  {
    label: "Admin",
    icon: LayoutDashboard,
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
      {
        label: "Hair Orders",
        link: "/dashboard/hair-orders",
      },
    ],
  },
];
