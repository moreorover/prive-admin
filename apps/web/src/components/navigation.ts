import {
  Calendar,
  HelpCircle,
  LayoutDashboard,
  Package,
  Settings,
} from "lucide-react";

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
    title: "Contacts",
    href: "/dashboard/contacts",
    icon: Package,
  },
  {
    title: "Bookings",
    href: "/dashboard/bookings",
    icon: Calendar,
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
