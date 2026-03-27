import { createFileRoute, redirect } from "@tanstack/react-router"
import {
  Activity,
  Database,
  FileText,
  LayoutDashboard,
  Lock,
  type LucideIcon,
  Monitor,
  Settings,
  Shield,
  TrendingUp,
  UserCog,
  Users,
  Zap,
} from "lucide-react"

import { Badge } from "@prive-admin-tanstack/ui/components/badge"
import { Button } from "@prive-admin-tanstack/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prive-admin-tanstack/ui/components/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@prive-admin-tanstack/ui/components/progress"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { getUser } from "@/functions/get-user"

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getUser()
    return { session }
  },
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

const stats = [
  { label: "Total Users", value: "1,284", change: "+12%", icon: Users },
  { label: "Active Sessions", value: "342", change: "+8%", icon: Activity },
  { label: "API Requests", value: "48.2k", change: "+23%", icon: Zap },
  { label: "Uptime", value: "99.97%", change: "+0.02%", icon: Monitor },
]

interface Capability {
  title: string
  description: string
  icon: LucideIcon
  status: "active" | "beta" | "coming"
  features: string[]
}

const capabilities: Capability[] = [
  {
    title: "User Management",
    description: "Full lifecycle user administration with role-based access control",
    icon: UserCog,
    status: "active",
    features: ["RBAC", "Invitations", "Audit log"],
  },
  {
    title: "Authentication",
    description: "Multi-provider auth with session management and MFA support",
    icon: Lock,
    status: "active",
    features: ["Email/Password", "OAuth", "MFA"],
  },
  {
    title: "Database Explorer",
    description: "Visual schema browser with query builder and migration tools",
    icon: Database,
    status: "active",
    features: ["Schema viewer", "Migrations", "Seeding"],
  },
  {
    title: "Analytics & Reports",
    description: "Real-time dashboards with custom report builder and export",
    icon: TrendingUp,
    status: "beta",
    features: ["Real-time", "Custom reports", "CSV export"],
  },
  {
    title: "API Monitoring",
    description: "Endpoint health checks, latency tracking, and alerting",
    icon: Shield,
    status: "beta",
    features: ["Health checks", "Latency P99", "Alerts"],
  },
  {
    title: "Content Management",
    description: "Structured content editor with versioning and publishing workflows",
    icon: FileText,
    status: "coming",
    features: ["Rich editor", "Versioning", "Workflows"],
  },
]

const systemHealth = [
  { label: "CPU Usage", value: 42 },
  { label: "Memory", value: 67 },
  { label: "Storage", value: 31 },
  { label: "Network I/O", value: 18 },
]

const recentActivity = [
  { action: "User invited", detail: "team@example.com", time: "2m ago" },
  { action: "Schema migrated", detail: "v0.45.2 applied", time: "18m ago" },
  { action: "API key rotated", detail: "prod-service-key", time: "1h ago" },
  { action: "Role updated", detail: "Editor permissions", time: "3h ago" },
  { action: "Backup completed", detail: "Full snapshot", time: "6h ago" },
]

function StatusBadge({ status }: { status: Capability["status"] }) {
  const variants = {
    active: "default",
    beta: "outline",
    coming: "secondary",
  } as const
  const labels = {
    active: "Active",
    beta: "Beta",
    coming: "Coming Soon",
  }
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

function StatCard({
  stat,
  index,
}: {
  stat: (typeof stats)[number]
  index: number
}) {
  const Icon = stat.icon
  return (
    <Card
      className="group relative overflow-hidden transition-shadow hover:ring-2 hover:ring-primary/20"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardContent className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground">{stat.label}</p>
          <p className="font-heading text-2xl font-bold tracking-tight">
            {stat.value}
          </p>
          <p className="text-[0.625rem] font-medium text-primary">
            {stat.change} from last month
          </p>
        </div>
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function CapabilityCard({ capability }: { capability: Capability }) {
  const Icon = capability.icon
  const isActive = capability.status === "active"

  return (
    <Card
      className={`group relative transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/20 ${
        !isActive ? "opacity-80" : ""
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon className="size-5" />
          </div>
          <StatusBadge status={capability.status} />
        </div>
        <CardTitle className="pt-2 text-sm font-semibold">
          {capability.title}
        </CardTitle>
        <CardDescription>{capability.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {capability.features.map((f) => (
            <span
              key={f}
              className="rounded-sm bg-muted px-1.5 py-0.5 text-[0.625rem] text-muted-foreground"
            >
              {f}
            </span>
          ))}
        </div>
      </CardContent>
      {isActive && (
        <div className="px-4 pb-4">
          <Button variant="ghost" size="sm" className="w-full justify-center">
            <Settings className="size-3" />
            Configure
          </Button>
        </div>
      )}
    </Card>
  )
}

function RouteComponent() {
  const { session } = Route.useRouteContext()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayoutDashboard className="size-4" />
            <span className="text-xs uppercase tracking-widest">Dashboard</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Welcome back, {session?.user.name ?? "Admin"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your platform capabilities and system health.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="size-3" />
          Settings
        </Button>
      </div>

      <Separator />

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </section>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Capabilities — 2 cols */}
        <section className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold tracking-tight">
              Platform Capabilities
            </h2>
            <span className="text-[0.625rem] text-muted-foreground">
              {capabilities.filter((c) => c.status === "active").length} active
              &middot; {capabilities.filter((c) => c.status === "beta").length}{" "}
              in beta
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {capabilities.map((cap) => (
              <CapabilityCard key={cap.title} capability={cap} />
            ))}
          </div>
        </section>

        {/* Sidebar — system health + activity */}
        <aside className="space-y-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-3.5 text-primary" />
                System Health
              </CardTitle>
              <CardDescription>Real-time resource utilization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealth.map((metric) => (
                <Progress key={metric.label} value={metric.value}>
                  <ProgressLabel>{metric.label}</ProgressLabel>
                  <ProgressValue />
                </Progress>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-3.5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-xs font-medium">
                        {item.action}
                      </p>
                      <p className="truncate text-[0.625rem] text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                    <span className="shrink-0 pl-3 text-[0.625rem] text-muted-foreground">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
