import * as Alchemy from "alchemy"
import * as Cloudflare from "alchemy/Cloudflare"
import * as GitHub from "alchemy/GitHub"
import * as Output from "alchemy/Output"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Redacted from "effect/Redacted"

type CloudflareResourceNames = {
  database: string
  serverWorker: string
  uploadsBucket: string
  webWorker: string
}

function getAlchemyStage(): string {
  const defaultStage = process.env.GITHUB_REF_NAME === "main" ? "prod" : "dev"
  return process.env.ALCHEMY_STAGE ?? process.env.STAGE ?? defaultStage
}

function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

function cloudflareResourceNames(stage: string): CloudflareResourceNames {
  const normalizedStage = stage.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase()

  return {
    database: `prive-admin-${normalizedStage}`,
    serverWorker: `prive-admin-server-${normalizedStage}`,
    uploadsBucket: `prive-admin-${normalizedStage}`,
    webWorker: `prive-admin-web-${normalizedStage}`,
  }
}

const stage = getAlchemyStage()
const names = cloudflareResourceNames(stage)

export default Alchemy.Stack(
  "prive-admin",
  {
    providers: Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const db = yield* Cloudflare.D1.Database("database", {
      migrationsDir: "./packages/db/src/migrations",
      name: names.database,
    })

    const uploadsBucket = yield* Cloudflare.R2.Bucket("uploads-bucket", {
      name: names.uploadsBucket,
    })

    const server = yield* Cloudflare.Worker("server-worker", {
      compatibility: {
        date: "2026-08-01",
        flags: ["nodejs_compat"],
      },
      env: {
        BETTER_AUTH_SECRET: Redacted.make(requireEnv("BETTER_AUTH_SECRET")),
        BETTER_AUTH_URL: requireEnv("BETTER_AUTH_URL"),
        CORS_ORIGIN: requireEnv("CORS_ORIGIN"),
        DB: db,
        NODE_ENV: requireEnv("NODE_ENV"),
        UPLOADS_BUCKET: uploadsBucket,
      },
      main: "./apps/server/src/index.ts",
      name: names.serverWorker,
    })

    const serverUrl = Output.map(server.url, (url) => url ?? "")
    const webServerUrl = process.env.PR_NUMBER ? serverUrl : (process.env.VITE_SERVER_URL ?? serverUrl)

    const web = yield* Cloudflare.Website.Vite("web-worker", {
      compatibility: {
        date: "2026-08-01",
      },
      env: {
        VITE_SERVER_URL: webServerUrl,
      },
      name: names.webWorker,
      rootDir: "./apps/web",
    })

    if (process.env.PR_NUMBER && process.env.GITHUB_REPOSITORY) {
      const [owner, repository] = process.env.GITHUB_REPOSITORY.split("/")

      if (owner && repository) {
        yield* GitHub.Comment("preview-comment", {
          body: Output.interpolate`
            Cloudflare preview deployed.

            Web: ${web.url}
            Server: ${serverUrl}
            Stage: ${stage}
            Commit: ${process.env.GITHUB_SHA ?? "local"}
          `,
          issueNumber: Number(process.env.PR_NUMBER),
          owner,
          repository,
        })
      }
    }

    return {
      serverUrl,
      stage,
      webUrl: web.url,
    }
  }),
)
