export const dashboardKeys = {
  all: ["dashboard"] as const,
  data: () => [...dashboardKeys.all, "data"] as const,
  capabilityDetails: (title: string) =>
    [...dashboardKeys.all, "capability-details", title] as const,
}

export const fileKeys = {
  all: ["files"] as const,
  list: () => [...fileKeys.all, "list"] as const,
}
