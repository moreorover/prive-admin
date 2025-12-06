import { Link, useRouter } from "@tanstack/react-router";
import {
  ChevronUp,
  LogOut,
  Settings as SettingsIcon,
  User,
  User2,
} from "lucide-react";
import { navigationItems } from "@/components/navigation";
import { VersionFooter } from "@/components/version-footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

interface AppSidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    // await queryClient.invalidateQueries({ queryKey: authQueries.all });
    router.invalidate();
  };

  const defaultUser = {
    name: user?.name || "John Doe",
    email: user?.email || "john.doe@example.com",
    avatar: user?.avatar || "",
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <User2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Your App</span>
                  <span className="truncate text-xs">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.href}
                      className="flex items-center gap-2"
                      activeOptions={
                        item.href === "/dashboard"
                          ? {
                              exact: true,
                              includeSearch: false,
                            }
                          : {
                              exact: false,
                              includeSearch: false,
                            }
                      }
                      activeProps={{
                        className: "bg-primary text-primary-foreground",
                      }}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={defaultUser.avatar}
                      alt={defaultUser.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {defaultUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {defaultUser.name}
                    </span>
                    <span className="truncate text-xs">
                      {defaultUser.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/dashboard/profile"
                      className="flex items-center gap-2"
                    >
                      <User className="size-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center gap-2"
                    >
                      <SettingsIcon className="size-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        <VersionFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
