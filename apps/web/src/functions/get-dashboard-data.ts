import { createServerFn } from "@tanstack/react-start"

import { requireAuthMiddleware } from "@/middleware/auth"

export interface DashboardStat {
  label: string
  value: string
  change: string
  icon: string
}

export interface DashboardCapability {
  title: string
  description: string
  icon: string
  status: "active" | "beta" | "coming"
  features: string[]
}

export interface SystemMetric {
  label: string
  value: number
}

export interface ActivityItem {
  action: string
  detail: string
  time: string
}

export interface DashboardData {
  stats: DashboardStat[]
  capabilities: DashboardCapability[]
  systemHealth: SystemMetric[]
  recentActivity: ActivityItem[]
}

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async (): Promise<DashboardData> => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // TODO: replace with real data sources
    const stats: DashboardStat[] = [
      { label: "Total Users", value: "1,284", change: "+12%", icon: "users" },
      { label: "Active Sessions", value: "342", change: "+8%", icon: "activity" },
      { label: "API Requests", value: "48.2k", change: "+23%", icon: "zap" },
      { label: "Uptime", value: "99.97%", change: "+0.02%", icon: "monitor" },
    ]

    const capabilities: DashboardCapability[] = [
      {
        title: "User Management",
        description: "Full lifecycle user administration with role-based access control",
        icon: "user-cog",
        status: "active",
        features: ["RBAC", "Invitations", "Audit log"],
      },
      {
        title: "Authentication",
        description: "Multi-provider auth with session management and MFA support",
        icon: "lock",
        status: "active",
        features: ["Email/Password", "OAuth", "MFA"],
      },
      {
        title: "Database Explorer",
        description: "Visual schema browser with query builder and migration tools",
        icon: "database",
        status: "active",
        features: ["Schema viewer", "Migrations", "Seeding"],
      },
      {
        title: "Analytics & Reports",
        description: "Real-time dashboards with custom report builder and export",
        icon: "trending-up",
        status: "beta",
        features: ["Real-time", "Custom reports", "CSV export"],
      },
      {
        title: "API Monitoring",
        description: "Endpoint health checks, latency tracking, and alerting",
        icon: "shield",
        status: "beta",
        features: ["Health checks", "Latency P99", "Alerts"],
      },
      {
        title: "Content Management",
        description: "Structured content editor with versioning and publishing workflows",
        icon: "file-text",
        status: "coming",
        features: ["Rich editor", "Versioning", "Workflows"],
      },
    ]

    const systemHealth: SystemMetric[] = [
      { label: "CPU Usage", value: 42 },
      { label: "Memory", value: 67 },
      { label: "Storage", value: 31 },
      { label: "Network I/O", value: 18 },
    ]

    const recentActivity: ActivityItem[] = [
      { action: "User invited", detail: "team@example.com", time: "2m ago" },
      { action: "Schema migrated", detail: "v0.45.2 applied", time: "18m ago" },
      { action: "API key rotated", detail: "prod-service-key", time: "1h ago" },
      { action: "Role updated", detail: "Editor permissions", time: "3h ago" },
      { action: "Backup completed", detail: "Full snapshot", time: "6h ago" },
    ]

    return { stats, capabilities, systemHealth, recentActivity }
  })
