import { createAuthClient } from "better-auth/react"

import { serverUrl } from "@/utils/server-url"

export const authClient = createAuthClient({
  baseURL: `${serverUrl}/api/auth`,
})
