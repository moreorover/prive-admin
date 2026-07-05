import { env } from "@prive-admin-tanstack/env/server"
import { drizzle } from "drizzle-orm/node-postgres"

import * as schema from "./schema"

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema })
}

export const db = createDb()

export type Db = typeof db
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0]

export * from "./repositories"
export { whereActiveLegalEntity } from "./scope"
