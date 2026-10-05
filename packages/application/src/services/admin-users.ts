export type AdminUserListQuery = {
  searchValue?: string
  searchField?: "email" | "name"
  searchOperator?: "contains" | "starts_with" | "ends_with"
  limit: number
  offset: number
  sortBy?: string
  sortDirection?: "asc" | "desc"
  filterField?: string
  filterValue?: string | number | boolean | string[] | number[]
  filterOperator?:
    | "eq"
    | "ne"
    | "lt"
    | "lte"
    | "gt"
    | "gte"
    | "in"
    | "not_in"
    | "contains"
    | "starts_with"
    | "ends_with"
}

export type AdminUsersApi = {
  createUser(input: {
    body: { email: string; password: string; name: string; role?: string | string[] }
    headers: Headers
  }): Promise<unknown>
  listUsers(input: { query: AdminUserListQuery; headers: Headers }): Promise<{ users: unknown[]; total: number }>
  adminUpdateUser(input: {
    body: { userId: string; data: Record<string, unknown> }
    headers: Headers
  }): Promise<unknown>
  removeUser(input: { body: { userId: string }; headers: Headers }): Promise<unknown>
  banUser(input: {
    body: { userId: string; banReason?: string; banExpiresIn?: number }
    headers: Headers
  }): Promise<unknown>
  unbanUser(input: { body: { userId: string }; headers: Headers }): Promise<unknown>
  setRole(input: { body: { userId: string; role: string | string[] }; headers: Headers }): Promise<unknown>
  setUserPassword(input: { body: { userId: string; newPassword: string }; headers: Headers }): Promise<unknown>
}

export function createAdminUserService(api: AdminUsersApi) {
  return {
    create: (input: Parameters<AdminUsersApi["createUser"]>[0]) => api.createUser(input),
    list: (input: Parameters<AdminUsersApi["listUsers"]>[0]) => api.listUsers(input),
    update: (input: Parameters<AdminUsersApi["adminUpdateUser"]>[0]) => api.adminUpdateUser(input),
    remove: (input: Parameters<AdminUsersApi["removeUser"]>[0]) => api.removeUser(input),
    ban: (input: Parameters<AdminUsersApi["banUser"]>[0]) => api.banUser(input),
    unban: (input: Parameters<AdminUsersApi["unbanUser"]>[0]) => api.unbanUser(input),
    setRole: (input: Parameters<AdminUsersApi["setRole"]>[0]) => api.setRole(input),
    setPassword: (input: Parameters<AdminUsersApi["setUserPassword"]>[0]) => api.setUserPassword(input),
  }
}
