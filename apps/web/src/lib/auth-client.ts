import { passkeyClient } from "@better-auth/passkey/client"
import { adminClient, twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { serverUrl } from "@/utils/server-url"

export const authClient = createAuthClient({
  baseURL: `${serverUrl}/api/auth`,
  plugins: [adminClient(), passkeyClient(), twoFactorClient({ twoFactorPage: "/two-factor" })],
})
