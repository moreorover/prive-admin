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
import type { DashboardCapability, DashboardStat } from "@/functions/get-dashboard-data"
import { getDashboardData } from "@/functions/get-dashboard-data"
import { getUser } from "@/functions/get-user"

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  activity: Activity,
  zap: Zap,
  monitor: Monitor,
  "user-cog": UserCog,
  lock: Lock,
  database: Database,
  "trending-up": TrendingUp,
  shield: Shield,
  "file-text": FileText,
}

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
    const dashboardData = await getDashboardData()
    return { dashboardData }
  },
})

function StatusBadge({ status }: { status: DashboardCapability["status"] }) {
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
  stat: DashboardStat
  index: number
}) {
  const Icon = iconMap[stat.icon] ?? Activity
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

function CapabilityCard({ capability }: { capability: DashboardCapability }) {
  const Icon = iconMap[capability.icon] ?? Activity
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
  const { dashboardData } = Route.useLoaderData()

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
        {dashboardData.stats.map((stat, i) => (
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
              {dashboardData.capabilities.filter((c) => c.status === "active").length} active
              &middot;{" "}
              {dashboardData.capabilities.filter((c) => c.status === "beta").length} in beta
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dashboardData.capabilities.map((cap) => (
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
              {dashboardData.systemHealth.map((metric) => (
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
                {dashboardData.recentActivity.map((item, i) => (
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
