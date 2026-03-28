import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"

export interface CapabilityDetails {
  title: string
  version: string
  lastUpdated: string
  usageCount: number
  errorRate: string
  avgResponseTime: string
  changelog: { version: string; date: string; summary: string }[]
}

const detailsMap: Record<string, CapabilityDetails> = {
  "User Management": {
    title: "User Management",
    version: "2.4.1",
    lastUpdated: "2026-03-26",
    usageCount: 8_421,
    errorRate: "0.02%",
    avgResponseTime: "120ms",
    changelog: [
      { version: "2.4.1", date: "2026-03-26", summary: "Fixed role assignment edge case for nested groups" },
      { version: "2.4.0", date: "2026-03-18", summary: "Added bulk user import via CSV" },
      { version: "2.3.0", date: "2026-02-28", summary: "Introduced audit log retention policies" },
    ],
  },
  Authentication: {
    title: "Authentication",
    version: "3.1.0",
    lastUpdated: "2026-03-24",
    usageCount: 34_192,
    errorRate: "0.01%",
    avgResponseTime: "85ms",
    changelog: [
      { version: "3.1.0", date: "2026-03-24", summary: "Added passkey/WebAuthn support" },
      { version: "3.0.2", date: "2026-03-10", summary: "Fixed session refresh race condition" },
      { version: "3.0.0", date: "2026-02-15", summary: "Migrated to better-auth v2 with MFA" },
    ],
  },
  "Database Explorer": {
    title: "Database Explorer",
    version: "1.8.3",
    lastUpdated: "2026-03-22",
    usageCount: 2_847,
    errorRate: "0.05%",
    avgResponseTime: "340ms",
    changelog: [
      { version: "1.8.3", date: "2026-03-22", summary: "Improved query builder autocomplete" },
      { version: "1.8.0", date: "2026-03-05", summary: "Added visual schema diff for migrations" },
      { version: "1.7.0", date: "2026-02-20", summary: "Seed data templates for dev environments" },
    ],
  },
  "Analytics & Reports": {
    title: "Analytics & Reports",
    version: "0.9.0-beta",
    lastUpdated: "2026-03-25",
    usageCount: 1_203,
    errorRate: "0.12%",
    avgResponseTime: "520ms",
    changelog: [
      { version: "0.9.0", date: "2026-03-25", summary: "Custom report builder with drag-and-drop" },
      { version: "0.8.0", date: "2026-03-12", summary: "Real-time dashboard streaming" },
      { version: "0.7.0", date: "2026-02-28", summary: "CSV and PDF export" },
    ],
  },
  "API Monitoring": {
    title: "API Monitoring",
    version: "0.6.2-beta",
    lastUpdated: "2026-03-27",
    usageCount: 956,
    errorRate: "0.08%",
    avgResponseTime: "95ms",
    changelog: [
      { version: "0.6.2", date: "2026-03-27", summary: "Added P99 latency percentile tracking" },
      { version: "0.6.0", date: "2026-03-15", summary: "Slack and PagerDuty alert integrations" },
      { version: "0.5.0", date: "2026-03-01", summary: "Endpoint health check scheduling" },
    ],
  },
  "Content Management": {
    title: "Content Management",
    version: "0.1.0-alpha",
    lastUpdated: "2026-03-20",
    usageCount: 0,
    errorRate: "—",
    avgResponseTime: "—",
    changelog: [
      { version: "0.1.0", date: "2026-03-20", summary: "Initial alpha with rich text editor" },
    ],
  },
}

export const getCapabilityDetails = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ title: z.string().min(1) }))
  .handler(async ({ data }): Promise<CapabilityDetails | null> => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return detailsMap[data.title] ?? null
  })
