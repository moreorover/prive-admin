import { createDb } from "@prive-admin-tanstack/db"
import * as schema from "@prive-admin-tanstack/db/schema/auth"
import { env } from "@prive-admin-tanstack/env/server"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

export function createAuth() {
  const db = createDb()

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    logger: {
      level: "debug",
    },
  })
}

export const auth = createAuth()
