import { trpcServer } from "@hono/trpc-server"
import { createContext } from "@prive-admin-tanstack/api/context"
import { apiRoutes } from "@prive-admin-tanstack/api/http"
import { appRouter } from "@prive-admin-tanstack/api/routers"
import { auth } from "@prive-admin-tanstack/auth"
import { env } from "@prive-admin-tanstack/env/server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

export const app = new Hono()

app.use(logger())
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
)

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
app.route("/api", apiRoutes)
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => createContext({ context }),
  }),
)
app.get("/", (c) => c.text("OK"))
