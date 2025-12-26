import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { env } from "@prive-admin/env/server";

export const db = drizzle(env.DATABASE_URL, { schema });
