import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import {
  Activity,
  Database,
  FileText,
  LayoutDashboard,
  Loader2,
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
import { useState } from "react"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@prive-admin-tanstack/ui/components/dialog"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import type { CapabilityDetails } from "@/functions/get-capability-details"
import { getCapabilityDetails } from "@/functions/get-capability-details"
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

const dashboardQueryOptions = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboardData(),
})

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
    await context.queryClient.prefetchQuery(dashboardQueryOptions)
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

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-2.5 w-24" />
        </div>
        <Skeleton className="size-9 rounded-md" />
      </CardContent>
    </Card>
  )
}

function CapabilityCard({
  capability,
  onClick,
}: {
  capability: DashboardCapability
  onClick: () => void
}) {
  const Icon = iconMap[capability.icon] ?? Activity
  const isActive = capability.status === "active"

  return (
    <Card
      className={`group relative cursor-pointer transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/20 ${
        !isActive ? "opacity-80" : ""
      }`}
      onClick={onClick}
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
            View Details
          </Button>
        </div>
      )}
    </Card>
  )
}

function CapabilityDetailsDialog({
  details,
  isLoading,
  open,
  onOpenChange,
}: {
  details: CapabilityDetails | null | undefined
  isLoading: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const Icon = details ? (iconMap[details.title.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")] ?? Activity) : Activity

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading details...</p>
          </div>
        ) : details ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                {details.title}
              </DialogTitle>
              <DialogDescription>
                Version {details.version} &middot; Updated {details.lastUpdated}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-md border p-3 text-center">
                <p className="font-heading text-lg font-bold">{details.usageCount.toLocaleString()}</p>
                <p className="text-[0.625rem] text-muted-foreground">Requests</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="font-heading text-lg font-bold">{details.errorRate}</p>
                <p className="text-[0.625rem] text-muted-foreground">Error Rate</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="font-heading text-lg font-bold">{details.avgResponseTime}</p>
                <p className="text-[0.625rem] text-muted-foreground">Avg Latency</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Changelog
              </h4>
              {details.changelog.map((entry) => (
                <div key={entry.version} className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[0.625rem]">
                      v{entry.version}
                    </Badge>
                    <span className="text-[0.625rem] text-muted-foreground">{entry.date}</span>
                  </div>
                  <p className="text-xs">{entry.summary}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No details available.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function CapabilityCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-32" />
        <Skeleton className="h-3 w-full" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-12 rounded-sm" />
          <Skeleton className="h-4 w-16 rounded-sm" />
          <Skeleton className="h-4 w-14 rounded-sm" />
        </div>
      </CardContent>
    </Card>
  )
}

function RouteComponent() {
  const { session } = Route.useRouteContext()
  const { data: dashboardData, isLoading } = useQuery(dashboardQueryOptions)
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: capabilityDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["capability-details", selectedCapability],
    queryFn: () => getCapabilityDetails({ data: { title: selectedCapability! } }),
    enabled: !!selectedCapability && dialogOpen,
  })

  const handleCapabilityClick = (title: string) => {
    setSelectedCapability(title)
    setDialogOpen(true)
  }

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
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : dashboardData?.stats.map((stat, i) => (
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
            {dashboardData && (
              <span className="text-[0.625rem] text-muted-foreground">
                {dashboardData.capabilities.filter((c) => c.status === "active").length} active
                &middot;{" "}
                {dashboardData.capabilities.filter((c) => c.status === "beta").length} in beta
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CapabilityCardSkeleton key={i} />)
              : dashboardData?.capabilities.map((cap) => (
                  <CapabilityCard
                    key={cap.title}
                    capability={cap}
                    onClick={() => handleCapabilityClick(cap.title)}
                  />
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
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <Skeleton className="h-1 w-full rounded-md" />
                    </div>
                  ))
                : dashboardData?.systemHealth.map((metric) => (
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
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start justify-between">
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-2.5 w-32" />
                        </div>
                        <Skeleton className="h-2.5 w-10" />
                      </div>
                    ))
                  : dashboardData?.recentActivity.map((item, i) => (
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

      <CapabilityDetailsDialog
        details={capabilityDetails}
        isLoading={isDetailsLoading}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
