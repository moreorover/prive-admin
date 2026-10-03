declare module "cloudflare:workers" {
  export const env: Env
}

declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[]
  }
}

declare global {
  interface Env {
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[]
  }
}

export {}
