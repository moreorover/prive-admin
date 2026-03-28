import type { ErrorComponentProps } from "@tanstack/react-router"

import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import { useQueryErrorResetBoundary } from "@tanstack/react-query"
import { Link, Outlet, createFileRoute, redirect, useRouter, useRouterState } from "@tanstack/react-router"
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  FolderOpen,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Scissors,
  Sun,
  Users,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { getUser } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"

const NAV_ITEMS = [
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/appointments", label: "Appointments", icon: Calendar },
  { to: "/hair-orders", label: "Hair Orders", icon: Scissors },
  { to: "/playground", label: "Playground", icon: LayoutDashboard },
  { to: "/files", label: "Files (Proxy)", icon: FolderOpen },
  { to: "/files-direct", label: "Files (Direct)", icon: HardDrive },
] as const

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  errorComponent: AuthenticatedErrorComponent,
  beforeLoad: async ({ location }) => {
    const session = await getUser()
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
    return { session }
  },
})

function AuthenticatedLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const { theme, setTheme } = useTheme()

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [currentPath])

  const sidebarContent = (
    <>
      {/* Nav items */}
      <nav className="flex-1 space-y-1 p-2 pt-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = currentPath === to || currentPath.startsWith(`${to}/`)
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } ${collapsed && !mobileOpen ? "justify-center" : ""}`}
              title={collapsed && !mobileOpen ? label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {(!collapsed || mobileOpen) && <span className="tracking-wide">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-3">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${
            collapsed && !mobileOpen ? "justify-center" : ""
          }`}
          title={collapsed && !mobileOpen ? "Toggle theme" : undefined}
        >
          {theme === "dark" ? <Sun className="size-4 shrink-0" /> : <Moon className="size-4 shrink-0" />}
          {(!collapsed || mobileOpen) && (
            <span className="tracking-wide">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          )}
        </button>

        {/* User info */}
        {(!collapsed || mobileOpen) && (
          <div className="mt-2 mb-2 truncate px-2 text-[10px] tracking-wide text-muted-foreground/50">
            {session?.user.email}
          </div>
        )}

        {/* Sign out */}
        <button
          type="button"
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.navigate({ to: "/" })
                },
              },
            })
          }}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-destructive ${
            collapsed && !mobileOpen ? "justify-center" : ""
          }`}
          title={collapsed && !mobileOpen ? "Sign out" : undefined}
        >
          <LogOut className="size-4 shrink-0" />
          {(!collapsed || mobileOpen) && <span className="tracking-wide">Sign Out</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="admin-layout flex h-svh overflow-hidden bg-background">
      {/* Mobile top bar */}
      <div className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Menu className="size-4" />
        </button>
        <span className="font-display text-sm tracking-[0.15em] text-foreground/70">
          Priv<span className="text-primary italic">e</span>
        </span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={() => {}}
        />
      )}

      {/* Mobile sidebar (slide-over) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="font-display text-sm tracking-[0.15em] text-foreground/70">
            Priv<span className="text-primary italic">e</span>
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`relative hidden flex-col border-r border-border bg-sidebar transition-all duration-300 md:flex ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {collapsed ? <Menu className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
          {!collapsed && (
            <span className="font-display text-sm tracking-[0.15em] text-foreground/70">
              Priv<span className="text-primary italic">e</span>
            </span>
          )}
        </div>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
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
    <div className="mx-auto flex w-full max-w-md items-center justify-center px-6 py-24">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="size-4 text-destructive" />
            Something went wrong
          </CardTitle>
          <CardDescription>{error.message || "An unexpected error occurred."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="size-3" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
