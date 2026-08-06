import alchemy from "alchemy"
import { D1Database, R2Bucket, Vite, Worker } from "alchemy/cloudflare"
import { GitHubComment } from "alchemy/github"
import { CloudflareStateStore } from "alchemy/state"

import { getAlchemyStage, requireEnv } from "./infra/cloudflare/alchemy-env"
import { cloudflareResourceNames } from "./infra/cloudflare/resources"

const stage = getAlchemyStage()
const names = cloudflareResourceNames(stage)
const isStableStage = stage === "dev" || stage === "prod"
const app = await alchemy("prive-admin", {
  noTrack: process.env.NO_TRACK === "1",
  stage,
  stateStore: (scope) => new CloudflareStateStore(scope),
})

const db = await D1Database("database", {
  adopt: true,
  delete: !isStableStage,
  migrationsDir: "./packages/db/src/migrations",
  name: names.database,
})

const uploadsBucket = await R2Bucket("uploads-bucket", {
  adopt: true,
  delete: !isStableStage,
  name: names.uploadsBucket,
})

const server = await Worker("server-worker", {
  adopt: true,
  bindings: {
    BETTER_AUTH_SECRET: alchemy.secret.env("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: requireEnv("BETTER_AUTH_URL"),
    CORS_ORIGIN: requireEnv("CORS_ORIGIN"),
    DB: db,
    NODE_ENV: requireEnv("NODE_ENV"),
    UPLOADS_BUCKET: uploadsBucket,
  },
  compatibilityDate: "2026-08-01",
  compatibilityFlags: ["nodejs_compat"],
  delete: !isStableStage,
  entrypoint: "./apps/server/src/index.ts",
  name: names.serverWorker,
  url: true,
})

const webServerUrl = process.env.PR_NUMBER ? server.url : (process.env.VITE_SERVER_URL ?? server.url)

const web = await Vite("web-worker", {
  adopt: true,
  bindings: {
    VITE_SERVER_URL: webServerUrl ?? "",
  },
  compatibilityDate: "2026-08-01",
  cwd: "./apps/web",
  delete: !isStableStage,
  name: names.webWorker,
  url: true,
})

if (process.env.PR_NUMBER && process.env.GITHUB_REPOSITORY) {
  const [owner, repository] = process.env.GITHUB_REPOSITORY.split("/")

  if (owner && repository) {
    await GitHubComment("preview-comment", {
      body: `Cloudflare preview deployed.

Web: ${web.url}
Server: ${server.url}
Stage: ${stage}
Commit: ${process.env.GITHUB_SHA ?? "local"}
`,
      issueNumber: Number(process.env.PR_NUMBER),
      owner,
      repository,
    })
  }
}

console.log({
  serverUrl: server.url,
  stage,
  webUrl: web.url,
})

await app.finalize()
