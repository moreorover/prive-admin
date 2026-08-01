import { env, type CloudflareEnv } from "@prive-admin-tanstack/env/server"
import { drizzle } from "drizzle-orm/d1"

import * as schema from "./schema"

export function createDb(database: D1Database = (env as CloudflareEnv).DB) {
  return drizzle(database, { schema })
}

export const db = createDb()

export type Db = ReturnType<typeof createDb>
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0]
