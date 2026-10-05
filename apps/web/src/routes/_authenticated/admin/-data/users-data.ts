import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { authClient } from "@/lib/auth-client"

export const adminUsersSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  search: z.string().catch(""),
})

export const ADMIN_USERS_PAGE_SIZE = 10

export function adminUsersQueryOptions(page: number, search: string) {
  return queryOptions({
    queryKey: ["admin", "users", { page, search }],
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: {
          limit: ADMIN_USERS_PAGE_SIZE,
          offset: (page - 1) * ADMIN_USERS_PAGE_SIZE,
          searchValue: search || undefined,
          searchField: "name",
          searchOperator: "contains",
          sortBy: "name",
          sortDirection: "asc",
        },
      })

      if (result.error) throw new Error(result.error.message || "Unable to load users")
      return result.data
    },
  })
}
