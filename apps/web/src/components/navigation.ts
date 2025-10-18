import { HelpCircle, LayoutDashboard, Package, Settings } from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: any;
  badge?: string | number;
  children?: NavigationItem[];
}

export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Package,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Login",
    href: "/",
    icon: HelpCircle,
  },
];

export const userMenuItems = [
  {
    title: "Profile",
    href: "/dashboard/profile",
  },
  {
    title: "Account Settings",
    href: "/dashboard/account",
  },
  {
    title: "Logout",
    href: "/logout",
  },
];
