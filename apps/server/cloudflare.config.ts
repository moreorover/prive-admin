import { bindings, defineConfig } from "cf/config"

export default defineConfig((ctx) => {
  switch (ctx.mode) {
    case "dev": {
      return {
        worker: {
          name: "prive-admin-server-dev",
          compatibilityDate: "2026-08-01",
          compatibilityFlags: ["nodejs_compat"],
          entrypoint: "src/index.ts",
          workersDev: true,
          env: {
            CORS_ORIGIN: bindings.text("http://localhost:3001"),
            BETTER_AUTH_URL: bindings.text("http://localhost:3000"),
            NODE_ENV: bindings.text("development"),
            BETTER_AUTH_SECRET: bindings.secret(),
            DB: bindings.d1({
              name: "prive-admin-dev",
              id: "551ac6ba-90c7-4656-bb31-f485b89edb72",
            }),
            UPLOADS_BUCKET: bindings.r2({
              name: "prive-admin-dev",
            }),
          },
        },
      }
    }
    case "prod": {
      return {
        worker: {
          name: "prive-admin-server-prod",
          compatibilityDate: "2026-08-01",
          compatibilityFlags: ["nodejs_compat"],
          entrypoint: "src/index.ts",
          workersDev: true,
          env: {
            CORS_ORIGIN: bindings.text(process.env.CORS_ORIGIN ?? "http://localhost:3001"),
            BETTER_AUTH_URL: bindings.text(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
            NODE_ENV: bindings.text(process.env.NODE_ENV ?? "production"),
            BETTER_AUTH_SECRET: bindings.secret(),
            DB: bindings.d1({
              name: "prive-admin-prod",
              id: "584abb96-8a47-4c60-8153-595410fc8271",
            }),
            UPLOADS_BUCKET: bindings.r2({
              name: "prive-admin-prod",
            }),
          },
        },
      }
    }
    default: {
      return {
        worker: {
          name: "prive-admin-server",
          compatibilityDate: "2026-08-01",
          compatibilityFlags: ["nodejs_compat"],
          entrypoint: "src/index.ts",
          env: {
            CORS_ORIGIN: bindings.text("http://localhost:3001"),
            BETTER_AUTH_URL: bindings.text("http://localhost:3000"),
            NODE_ENV: bindings.text("development"),
            BETTER_AUTH_SECRET: bindings.secret(),
            DB: bindings.d1({
              name: "prive-admin-dev",
              id: "551ac6ba-90c7-4656-bb31-f485b89edb72",
            }),
            UPLOADS_BUCKET: bindings.r2({
              name: "prive-admin-dev",
            }),
          },
        },
      }
    }
  }
})
