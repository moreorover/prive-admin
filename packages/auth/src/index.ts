import type { Auth, BetterAuthOptions, DBAdapter } from "better-auth"

import { createDb } from "@prive-admin-tanstack/db/client"
import * as schema from "@prive-admin-tanstack/db/schema/auth"
import { env } from "@prive-admin-tanstack/env/server"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { betterAuth } from "better-auth/minimal"

type AppAuthOptions = BetterAuthOptions & {
  database: (options: BetterAuthOptions) => DBAdapter<BetterAuthOptions>
  trustedOrigins: string[]
  emailAndPassword: {
    enabled: true
    disableSignUp: true
  }
  session: {
    cookieCache: {
      enabled: true
      maxAge: number
    }
  }
  secret: string
  baseURL: string
  advanced: {
    ipAddress: {
      ipAddressHeaders: string[]
    }
  }
  logger: {
    level: "debug"
  }
}

export type AppAuth = Auth<AppAuthOptions>

export function createAuth(): AppAuth {
  const db = createDb()

  const options: AppAuthOptions = {
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
      },
    },
    logger: {
      level: "debug",
    },
  }

  return betterAuth(options)
}

export const auth = createAuth()
