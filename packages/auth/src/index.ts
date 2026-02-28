import { db } from "@prive-admin/db"
import * as schema from "@prive-admin/db/schema/auth"
import { customer, customerUser } from "@prive-admin/db/schema/customer"
import { env } from "@prive-admin/env/server"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"
import { eq } from "drizzle-orm"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [admin()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (!user.email) return

          const matchingCustomers = await db
            .select({ id: customer.id })
            .from(customer)
            .where(eq(customer.email, user.email))

          if (matchingCustomers.length > 0) {
            await db.insert(customerUser).values(
              matchingCustomers.map((c) => ({
                customerId: c.id,
                userId: user.id,
              })),
            )
          }
        },
      },
    },
  },
})
