export interface CloudflareEnv {
  DB: D1Database
  UPLOADS_BUCKET: R2Bucket
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  CORS_ORIGIN: string
  NODE_ENV?: "development" | "production" | "test"
}

declare global {
  interface Env extends CloudflareEnv {}
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
