import { sql } from "drizzle-orm"
import { integer } from "drizzle-orm/sqlite-core"

export function timestampMs(name: string) {
  return integer(name, { mode: "timestamp_ms" })
}

export function createdAt(name = "created_at") {
  return timestampMs(name)
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull()
}

export function updatedAt(name = "updated_at") {
  return timestampMs(name)
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull()
}
