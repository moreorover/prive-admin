export const dashboardKeys = {
  all: ["dashboard"] as const,
  data: () => [...dashboardKeys.all, "data"] as const,
  capabilityDetails: (title: string) => [...dashboardKeys.all, "capability-details", title] as const,
  transactionStats: (year: number) => [...dashboardKeys.all, "transaction-stats", year] as const,
  hairAssignedStats: (year: number) => [...dashboardKeys.all, "hair-assigned-stats", year] as const,
  hairSaleStats: (year: number) => [...dashboardKeys.all, "hair-sale-stats", year] as const,
}

export const fileKeys = {
  all: ["files"] as const,
  list: () => [...fileKeys.all, "list"] as const,
}

export const customerKeys = {
  all: ["customers"] as const,
  list: () => [...customerKeys.all, "list"] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
  summary: (id: string) => [...customerKeys.all, "summary", id] as const,
}

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: () => [...appointmentKeys.all, "list"] as const,
  detail: (id: string) => [...appointmentKeys.all, "detail", id] as const,
  byCustomer: (customerId: string) => [...appointmentKeys.all, "by-customer", customerId] as const,
}

export const salonKeys = {
  all: ["salons"] as const,
  list: () => [...salonKeys.all, "list"] as const,
  detail: (id: string) => [...salonKeys.all, "detail", id] as const,
}

export const hairOrderKeys = {
  all: ["hair-orders"] as const,
  list: () => [...hairOrderKeys.all, "list"] as const,
  detail: (id: string) => [...hairOrderKeys.all, "detail", id] as const,
}

export const noteKeys = {
  all: ["notes"] as const,
  list: (filter: Record<string, string | undefined>) => [...noteKeys.all, "list", filter] as const,
}

export const hairAssignedKeys = {
  all: ["hair-assigned"] as const,
  byHairOrder: (id: string) => [...hairAssignedKeys.all, "by-hair-order", id] as const,
  byAppointment: (id: string) => [...hairAssignedKeys.all, "by-appointment", id] as const,
  byCustomer: (id: string) => [...hairAssignedKeys.all, "by-customer", id] as const,
}

export const transactionKeys = {
  all: ["transactions"] as const,
  byAppointment: (appointmentId: string) => [...transactionKeys.all, "by-appointment", appointmentId] as const,
}

export const userSettingsKeys = {
  all: ["user-settings"] as const,
  current: () => [...userSettingsKeys.all, "current"] as const,
}
