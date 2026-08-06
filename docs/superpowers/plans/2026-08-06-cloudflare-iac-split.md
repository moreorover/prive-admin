# Cloudflare IaC Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a low-risk Cloudflare infrastructure workflow where Alchemy owns app deployment and preview environments, while Terraform owns stable imported Cloudflare resources.

**Architecture:** Keep the existing Wrangler deployments working while introducing Alchemy as a parallel deploy path for `apps/server` and `apps/web`. Add Terraform only for long-lived Cloudflare resources after existing D1/R2 resources are imported, with destructive operations blocked by lifecycle rules and CI plan review.

**Tech Stack:** Vite+, pnpm workspace, GitHub Actions, Wrangler, Cloudflare Workers, Cloudflare D1, Cloudflare R2, Alchemy TypeScript IaC, Terraform Cloudflare provider v5.

## Global Constraints

- Run `vp install` after dependency changes.
- Run `vp check` and `vp test` to format, lint, type check and test changes.
- Check `vite.config.ts` tasks and `package.json` scripts necessary for validation, run via `vp run <script>`.
- Keep existing Wrangler deploy workflows intact until an Alchemy prod deployment has been verified.
- Do not move D1 data-owning resources to Terraform without importing existing resource IDs first.
- Do not let Terraform destroy or replace D1 databases; use `prevent_destroy = true`.
- Keep secrets in GitHub/1Password environment variables; do not commit account IDs, API tokens, Better Auth secrets, or production URLs.
- Use conventional commit messages.

---

## File Structure

- Create `alchemy.run.ts`: top-level Alchemy stack for app deployment.
- Create `infra/cloudflare/resources.ts`: shared Cloudflare resource naming helpers for stages and imported physical names.
- Create `infra/cloudflare/alchemy-env.ts`: environment parsing helpers used by the Alchemy stack.
- Modify `package.json`: add Alchemy scripts and dependency.
- Modify `.github/workflows/cloudflare-dev-deploy.yml`: add manual/shadow Alchemy deploy job or a separate workflow reference, without removing Wrangler.
- Create `.github/workflows/cloudflare-alchemy-preview.yml`: PR preview deployment and cleanup flow.
- Create `infra/terraform/cloudflare/main.tf`: stable resource declarations/import targets for D1 and R2.
- Create `infra/terraform/cloudflare/variables.tf`: Cloudflare account input variables.
- Create `infra/terraform/cloudflare/imports.tf`: import block definitions for existing dev/prod D1 and R2.
- Create `infra/terraform/cloudflare/versions.tf`: Terraform and provider constraints.
- Create `infra/terraform/cloudflare/README.md`: operator workflow and import/apply guardrails.
- Create `.github/workflows/cloudflare-terraform-plan.yml`: plan-only CI workflow for Terraform changes.

---

### Task 1: Add Alchemy Stack Scaffolding

**Files:**
- Create: `infra/cloudflare/alchemy-env.ts`
- Create: `infra/cloudflare/resources.ts`
- Create: `alchemy.run.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `getAlchemyStage(): "dev" | "prod" | string`
- Produces: `cloudflareResourceNames(stage: string): { serverWorker: string; webWorker: string; database: string; uploadsBucket: string }`
- Produces: root scripts `deploy:alchemy`, `destroy:alchemy`, and `plan:alchemy`

- [ ] **Step 1: Add dependency and scripts to `package.json`**

Add `alchemy` to `devDependencies` and add root scripts:

```json
{
  "scripts": {
    "deploy:alchemy": "alchemy deploy",
    "destroy:alchemy": "alchemy destroy",
    "plan:alchemy": "alchemy plan"
  },
  "devDependencies": {
    "alchemy": "^0.93.12"
  }
}
```

Keep all existing scripts. Place the new scripts near the current deployment/build scripts and preserve JSON sorting style already used in the file.

- [ ] **Step 2: Add stage environment helper**

Create `infra/cloudflare/alchemy-env.ts`:

```ts
const defaultStage = process.env.GITHUB_REF_NAME === "main" ? "prod" : "dev"

export function getAlchemyStage(): string {
  return process.env.ALCHEMY_STAGE ?? process.env.STAGE ?? defaultStage
}

export function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}
```

- [ ] **Step 3: Add Cloudflare physical naming helper**

Create `infra/cloudflare/resources.ts`:

```ts
export type CloudflareResourceNames = {
  database: string
  serverWorker: string
  uploadsBucket: string
  webWorker: string
}

export function cloudflareResourceNames(stage: string): CloudflareResourceNames {
  const normalizedStage = stage.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase()

  return {
    database: `prive-admin-${normalizedStage}`,
    serverWorker: `prive-admin-server-${normalizedStage}`,
    uploadsBucket: `prive-admin-${normalizedStage}`,
    webWorker: `prive-admin-web-${normalizedStage}`,
  }
}
```

- [ ] **Step 4: Add initial Alchemy stack**

Create `alchemy.run.ts`:

```ts
import * as Alchemy from "alchemy"
import * as Cloudflare from "alchemy/Cloudflare"
import * as Effect from "effect/Effect"

import { getAlchemyStage, requireEnv } from "./infra/cloudflare/alchemy-env"
import { cloudflareResourceNames } from "./infra/cloudflare/resources"

const stage = getAlchemyStage()
const names = cloudflareResourceNames(stage)

export default Alchemy.Stack(
  "prive-admin",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state({ noTrack: process.env.NO_TRACK === "1" }),
  },
  Effect.gen(function* () {
    const db = yield* Cloudflare.D1.Database("Database", {
      databaseName: names.database,
      migrationsDir: "./packages/db/src/migrations",
    })

    const uploadsBucket = yield* Cloudflare.R2.Bucket("UploadsBucket", {
      name: names.uploadsBucket,
    })

    const server = yield* Cloudflare.Worker("ServerWorker", {
      compatibility: {
        date: "2026-08-01",
        flags: ["nodejs_compat"],
      },
      env: {
        BETTER_AUTH_SECRET: Cloudflare.Secret.fromEnv("BETTER_AUTH_SECRET"),
        BETTER_AUTH_URL: requireEnv("BETTER_AUTH_URL"),
        CORS_ORIGIN: requireEnv("CORS_ORIGIN"),
        DB: db,
        NODE_ENV: requireEnv("NODE_ENV"),
        UPLOADS_BUCKET: uploadsBucket,
      },
      main: "./apps/server/src/index.ts",
      name: names.serverWorker,
      workersDev: { enabled: true },
    })

    const web = yield* Cloudflare.Website.Vite("WebWorker", {
      env: {
        VITE_SERVER_URL: process.env.VITE_SERVER_URL ?? server.url,
      },
      name: names.webWorker,
      rootDir: "./apps/web",
      workersDev: { enabled: true },
    })

    return {
      serverUrl: server.url,
      stage,
      webUrl: web.url,
    }
  }),
)
```

If Alchemy’s installed API uses lower-case imports instead of `alchemy/Cloudflare`, adjust only the imports and resource names to match the installed package docs, keeping the stack shape and file boundaries unchanged.

- [ ] **Step 5: Install dependencies**

Run:

```bash
vp install
```

Expected: lockfile updates and no install errors.

- [ ] **Step 6: Type-check Alchemy scaffold**

Run:

```bash
vp run check-types
```

Expected: PASS. If Alchemy types require API adjustments, make the minimal edits in `alchemy.run.ts` and repeat this step.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml alchemy.run.ts infra/cloudflare/alchemy-env.ts infra/cloudflare/resources.ts
git commit -m "feat: add alchemy cloudflare stack"
```

---

### Task 2: Add Alchemy Preview Deployment Workflow

**Files:**
- Create: `.github/workflows/cloudflare-alchemy-preview.yml`
- Modify: `alchemy.run.ts`

**Interfaces:**
- Consumes: `getAlchemyStage()` and `cloudflareResourceNames(stage)`
- Produces: PR stages named `pr-<number>`
- Produces: cleanup command `vp run destroy:alchemy -- --stage pr-<number>`

- [ ] **Step 1: Add PR metadata support to `alchemy.run.ts`**

Add this import:

```ts
import * as GitHub from "alchemy/GitHub"
import * as Layer from "effect/Layer"
import * as Output from "alchemy/Output"
```

Change stack providers to merge Cloudflare and GitHub:

```ts
providers: Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
```

Inside the stack body, after `web` is created, add:

```ts
const github = yield* GitHub.GitHubEnv

if (github?.pr) {
  yield* GitHub.Comment("PreviewComment", {
    body: Output.interpolate`
Cloudflare preview deployed.

Web: ${web.url}
Server: ${server.url}
Stage: ${stage}
Commit: ${process.env.GITHUB_SHA ?? "local"}
`,
    issueNumber: github.pr,
    owner: github.owner,
    repository: github.repository,
  })
}
```

- [ ] **Step 2: Add preview workflow**

Create `.github/workflows/cloudflare-alchemy-preview.yml`:

```yaml
name: Cloudflare Alchemy Preview

on:
  pull_request:
    branches:
      - main
    types:
      - opened
      - synchronize
      - reopened
      - ready_for_review
      - closed
  workflow_dispatch:

concurrency:
  group: cloudflare-alchemy-preview-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  deploy:
    name: Deploy Preview
    if: github.event_name != 'pull_request' || (github.event.action != 'closed' && github.event.pull_request.draft == false)
    runs-on: ubuntu-latest
    environment:
      name: cloudflare-dev
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v7

      - name: Setup Vite+
        uses: voidzero-dev/setup-vp@v1
        with:
          node-version: "24"
          cache: true

      - name: Install Dependencies
        run: vp install --frozen-lockfile

      - name: Load Cloudflare Dev Secrets
        uses: 1password/load-secrets-action@v4
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: op://prive-admin/prive-admin-cloudflare-dev/cloudflare/account-id
          CLOUDFLARE_API_TOKEN: op://prive-admin/prive-admin-cloudflare-dev/cloudflare/api-token
          CORS_ORIGIN: op://prive-admin/prive-admin-cloudflare-dev/workers/cors-origin
          BETTER_AUTH_URL: op://prive-admin/prive-admin-cloudflare-dev/better-auth/BETTER_AUTH_URL
          BETTER_AUTH_SECRET: op://prive-admin/prive-admin-cloudflare-dev/better-auth/BETTER_AUTH_SECRET
          VITE_SERVER_URL: op://prive-admin/prive-admin-cloudflare-dev/web/VITE_SERVER_URL
          NODE_ENV: op://prive-admin/prive-admin-cloudflare-dev/workers/node-env

      - name: Deploy Alchemy Preview
        run: vp run deploy:alchemy -- --stage pr-${{ github.event.pull_request.number || github.run_number }}
        env:
          ALCHEMY_PASSWORD: ${{ secrets.ALCHEMY_PASSWORD }}
          ALCHEMY_STATE_TOKEN: ${{ secrets.ALCHEMY_STATE_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ env.CLOUDFLARE_API_TOKEN }}
          CORS_ORIGIN: ${{ env.CORS_ORIGIN }}
          BETTER_AUTH_URL: ${{ env.BETTER_AUTH_URL }}
          BETTER_AUTH_SECRET: ${{ env.BETTER_AUTH_SECRET }}
          VITE_SERVER_URL: ${{ env.VITE_SERVER_URL }}
          NODE_ENV: ${{ env.NODE_ENV }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NO_TRACK: "1"

  cleanup:
    name: Destroy Preview
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    environment:
      name: cloudflare-dev
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v7

      - name: Setup Vite+
        uses: voidzero-dev/setup-vp@v1
        with:
          node-version: "24"
          cache: true

      - name: Install Dependencies
        run: vp install --frozen-lockfile

      - name: Load Cloudflare Dev Secrets
        uses: 1password/load-secrets-action@v4
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: op://prive-admin/prive-admin-cloudflare-dev/cloudflare/account-id
          CLOUDFLARE_API_TOKEN: op://prive-admin/prive-admin-cloudflare-dev/cloudflare/api-token

      - name: Destroy Alchemy Preview
        run: vp run destroy:alchemy -- --stage pr-${{ github.event.pull_request.number }}
        env:
          ALCHEMY_PASSWORD: ${{ secrets.ALCHEMY_PASSWORD }}
          ALCHEMY_STATE_TOKEN: ${{ secrets.ALCHEMY_STATE_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ env.CLOUDFLARE_API_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NO_TRACK: "1"
```

- [ ] **Step 3: Validate workflow syntax locally**

Run:

```bash
vp run check-types
```

Expected: PASS for TypeScript. Then inspect the workflow for unresolved secret names:

```bash
rg "ALCHEMY_PASSWORD|ALCHEMY_STATE_TOKEN|CLOUDFLARE_ACCOUNT_ID|CLOUDFLARE_API_TOKEN" .github/workflows/cloudflare-alchemy-preview.yml
```

Expected: all four names are present.

- [ ] **Step 4: Commit**

```bash
git add alchemy.run.ts .github/workflows/cloudflare-alchemy-preview.yml
git commit -m "ci: add alchemy preview deployments"
```

---

### Task 3: Add Shadow Alchemy Dev/Prod Deployment Workflows

**Files:**
- Create: `.github/workflows/cloudflare-alchemy-deploy.yml`
- Modify: `.github/workflows/cloudflare-dev-deploy.yml`
- Modify: `.github/workflows/cloudflare-prod-deploy.yml`

**Interfaces:**
- Consumes: root script `deploy:alchemy`
- Produces: manual Alchemy dev/prod deploy workflow
- Keeps: existing Wrangler dev/prod deploy workflows enabled

- [ ] **Step 1: Add manual Alchemy deployment workflow**

Create `.github/workflows/cloudflare-alchemy-deploy.yml`:

```yaml
name: Cloudflare Alchemy Deploy

on:
  workflow_dispatch:
    inputs:
      stage:
        description: Cloudflare stage to deploy
        required: true
        default: dev
        type: choice
        options:
          - dev
          - prod

concurrency:
  group: cloudflare-alchemy-${{ inputs.stage }}
  cancel-in-progress: false

jobs:
  deploy:
    name: Deploy Alchemy ${{ inputs.stage }}
    runs-on: ubuntu-latest
    environment:
      name: cloudflare-${{ inputs.stage }}
    permissions:
      contents: read
    steps:
      - name: Checkout Code
        uses: actions/checkout@v7

      - name: Setup Vite+
        uses: voidzero-dev/setup-vp@v1
        with:
          node-version: "24"
          cache: true

      - name: Install Dependencies
        run: vp install --frozen-lockfile

      - name: Load Cloudflare Secrets
        uses: 1password/load-secrets-action@v4
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: op://prive-admin/prive-admin-cloudflare-${{ inputs.stage }}/cloudflare/account-id
          CLOUDFLARE_API_TOKEN: op://prive-admin/prive-admin-cloudflare-${{ inputs.stage }}/cloudflare/api-token
          CORS_ORIGIN: op://prive-admin/prive-admin-cloudflare-${{ inputs.stage }}/workers/cors-origin
          BETTER_AUTH_URL: op://prive-admin/prive-admin-cloudflare-${{ inputs.stage }}/better-auth/BETTER_AUTH_URL
          BETTER_AUTH_SECRET: op://prive-admin/prive-admin-cloudflare-${{ inputs.stage }}/better-auth/BETTER_AUTH_SECRET
          VITE_SERVER_URL: op://prive-admin/prive-admin-cloudflare-${{ inputs.stage }}/web/VITE_SERVER_URL
          NODE_ENV: op://prive-admin/prive-admin-cloudflare-${{ inputs.stage }}/workers/node-env

      - name: Deploy Alchemy
        run: vp run deploy:alchemy -- --stage ${{ inputs.stage }}
        env:
          ALCHEMY_PASSWORD: ${{ secrets.ALCHEMY_PASSWORD }}
          ALCHEMY_STATE_TOKEN: ${{ secrets.ALCHEMY_STATE_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ env.CLOUDFLARE_API_TOKEN }}
          CORS_ORIGIN: ${{ env.CORS_ORIGIN }}
          BETTER_AUTH_URL: ${{ env.BETTER_AUTH_URL }}
          BETTER_AUTH_SECRET: ${{ env.BETTER_AUTH_SECRET }}
          VITE_SERVER_URL: ${{ env.VITE_SERVER_URL }}
          NODE_ENV: ${{ env.NODE_ENV }}
          NO_TRACK: "1"
```

- [ ] **Step 2: Add comments to Wrangler workflows**

At the top of both `.github/workflows/cloudflare-dev-deploy.yml` and `.github/workflows/cloudflare-prod-deploy.yml`, add:

```yaml
# Wrangler remains the authoritative deploy path until
# Cloudflare Alchemy Deploy has successfully shipped dev and prod.
```

- [ ] **Step 3: Validate workflows and package scripts**

Run:

```bash
rg "deploy:alchemy|Cloudflare Alchemy Deploy|Wrangler remains" package.json .github/workflows
```

Expected: output includes the root script, the new workflow name, and comments in both Wrangler workflows.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/cloudflare-alchemy-deploy.yml .github/workflows/cloudflare-dev-deploy.yml .github/workflows/cloudflare-prod-deploy.yml
git commit -m "ci: add shadow alchemy deployment workflow"
```

---

### Task 4: Add Terraform Stable Resource Layer

**Files:**
- Create: `infra/terraform/cloudflare/versions.tf`
- Create: `infra/terraform/cloudflare/variables.tf`
- Create: `infra/terraform/cloudflare/main.tf`
- Create: `infra/terraform/cloudflare/imports.tf`
- Create: `infra/terraform/cloudflare/README.md`

**Interfaces:**
- Produces: Terraform module at `infra/terraform/cloudflare`
- Produces: import targets for existing D1 and R2 resources
- Does not deploy Workers

- [ ] **Step 1: Add provider constraints**

Create `infra/terraform/cloudflare/versions.tf`:

```hcl
terraform {
  required_version = ">= 1.8.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.22"
    }
  }
}
```

- [ ] **Step 2: Add variables**

Create `infra/terraform/cloudflare/variables.tf`:

```hcl
variable "cloudflare_account_id" {
  description = "Cloudflare account ID for Prive Admin resources."
  type        = string
  sensitive   = true
}
```

- [ ] **Step 3: Add stable imported resources**

Create `infra/terraform/cloudflare/main.tf`:

```hcl
provider "cloudflare" {}

resource "cloudflare_d1_database" "dev" {
  account_id = var.cloudflare_account_id
  name       = "prive-admin-dev"

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_d1_database" "prod" {
  account_id = var.cloudflare_account_id
  name       = "prive-admin-prod"

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_r2_bucket" "dev_uploads" {
  account_id = var.cloudflare_account_id
  name       = "prive-admin-dev"

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_r2_bucket" "prod_uploads" {
  account_id = var.cloudflare_account_id
  name       = "prive-admin-prod"

  lifecycle {
    prevent_destroy = true
  }
}
```

- [ ] **Step 4: Add import blocks**

Create `infra/terraform/cloudflare/imports.tf`:

```hcl
import {
  to = cloudflare_d1_database.dev
  id = "${var.cloudflare_account_id}/596a4e0b-f8a7-4024-a8a2-263503c9309b"
}

import {
  to = cloudflare_d1_database.prod
  id = "${var.cloudflare_account_id}/584abb96-8a47-4c60-8153-595410fc8271"
}

import {
  to = cloudflare_r2_bucket.dev_uploads
  id = "${var.cloudflare_account_id}/prive-admin-dev/default"
}

import {
  to = cloudflare_r2_bucket.prod_uploads
  id = "${var.cloudflare_account_id}/prive-admin-prod/default"
}
```

- [ ] **Step 5: Add Terraform operator docs**

Create `infra/terraform/cloudflare/README.md`:

```markdown
# Cloudflare Terraform

This Terraform root manages stable Cloudflare resources only. Worker code deployments stay in Wrangler until the Alchemy deployment path is promoted, then Alchemy owns app deployments.

## Managed Here

- `prive-admin-dev` D1 database
- `prive-admin-prod` D1 database
- `prive-admin-dev` R2 uploads bucket
- `prive-admin-prod` R2 uploads bucket

## Guardrails

- D1 and R2 resources use `prevent_destroy = true`.
- Existing resources must be imported before any apply.
- Do not add Worker script deployment resources here; use Alchemy for Workers.
- Run `terraform plan` and review any resource replacement before apply.

## First Import

```bash
cd infra/terraform/cloudflare
terraform init
terraform plan -var cloudflare_account_id="$CLOUDFLARE_ACCOUNT_ID"
terraform apply -var cloudflare_account_id="$CLOUDFLARE_ACCOUNT_ID"
```

The first apply imports existing resources declared in `imports.tf`. Expected changes are imports only. Stop if the plan includes destroy or replacement.
```

- [ ] **Step 6: Format Terraform**

Run:

```bash
terraform fmt infra/terraform/cloudflare
```

Expected: files are formatted.

- [ ] **Step 7: Commit**

```bash
git add infra/terraform/cloudflare
git commit -m "feat: add cloudflare terraform resource layer"
```

---

### Task 5: Add Terraform Plan CI

**Files:**
- Create: `.github/workflows/cloudflare-terraform-plan.yml`

**Interfaces:**
- Consumes: Terraform root `infra/terraform/cloudflare`
- Produces: PR plan validation for Terraform-only changes

- [ ] **Step 1: Add Terraform plan workflow**

Create `.github/workflows/cloudflare-terraform-plan.yml`:

```yaml
name: Cloudflare Terraform Plan

on:
  pull_request:
    paths:
      - infra/terraform/cloudflare/**
      - .github/workflows/cloudflare-terraform-plan.yml
  workflow_dispatch:

concurrency:
  group: cloudflare-terraform-plan-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  plan:
    name: Terraform Plan
    runs-on: ubuntu-latest
    environment:
      name: cloudflare-dev
    permissions:
      contents: read
    steps:
      - name: Checkout Code
        uses: actions/checkout@v7

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v4
        with:
          terraform_version: 1.13.0

      - name: Load Cloudflare Dev Secrets
        uses: 1password/load-secrets-action@v4
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: op://prive-admin/prive-admin-cloudflare-dev/cloudflare/account-id
          CLOUDFLARE_API_TOKEN: op://prive-admin/prive-admin-cloudflare-dev/cloudflare/api-token

      - name: Terraform Init
        working-directory: infra/terraform/cloudflare
        run: terraform init -input=false
        env:
          CLOUDFLARE_API_TOKEN: ${{ env.CLOUDFLARE_API_TOKEN }}

      - name: Terraform Format Check
        working-directory: infra/terraform/cloudflare
        run: terraform fmt -check

      - name: Terraform Plan
        working-directory: infra/terraform/cloudflare
        run: terraform plan -input=false -var cloudflare_account_id="$CLOUDFLARE_ACCOUNT_ID"
        env:
          CLOUDFLARE_API_TOKEN: ${{ env.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CLOUDFLARE_ACCOUNT_ID }}
```

- [ ] **Step 2: Validate workflow references**

Run:

```bash
rg "terraform init|terraform fmt|terraform plan|cloudflare_account_id" .github/workflows/cloudflare-terraform-plan.yml infra/terraform/cloudflare
```

Expected: output includes all three Terraform commands and the variable in both workflow and Terraform files.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/cloudflare-terraform-plan.yml
git commit -m "ci: add cloudflare terraform plan workflow"
```

---

### Task 6: Verification and Cutover Decision

**Files:**
- Modify: `docs/deploy/cloudflare-d1.md`
- Modify: `.github/workflows/cloudflare-dev-deploy.yml`
- Modify: `.github/workflows/cloudflare-prod-deploy.yml`

**Interfaces:**
- Consumes: Alchemy dev/prod workflow results
- Consumes: Terraform plan CI results
- Produces: documented source of truth for app deploys and stable resources

- [ ] **Step 1: Add deployment ownership notes**

Append this section to `docs/deploy/cloudflare-d1.md`:

```markdown
## Deployment Ownership

Cloudflare app deployment is moving to Alchemy after shadow verification. Stable Cloudflare resources are tracked in Terraform under `infra/terraform/cloudflare`.

Current ownership:

- Worker code and static assets: Wrangler until the Alchemy workflow has deployed dev and prod successfully.
- PR preview Workers/resources: Alchemy.
- D1 database resources: Terraform after import; migrations run through the app deployment path.
- R2 uploads buckets: Terraform after import; Worker bindings come from the app deployment path.
```

- [ ] **Step 2: Run full project verification**

Run:

```bash
vp check
vp test
```

Expected: both PASS.

- [ ] **Step 3: Verify Alchemy dev deploy manually**

Run GitHub Actions workflow `Cloudflare Alchemy Deploy` with `stage=dev`.

Expected:
- Workflow completes successfully.
- Server Worker responds on its workers.dev URL.
- Web Worker loads and points at the expected server URL.
- D1 migrations do not recreate the dev database.
- R2 binding name is `UPLOADS_BUCKET`.

- [ ] **Step 4: Verify Alchemy prod deploy manually**

Run GitHub Actions workflow `Cloudflare Alchemy Deploy` with `stage=prod`.

Expected:
- Workflow completes successfully.
- Server Worker responds on its workers.dev URL.
- Web Worker loads and points at the expected server URL.
- D1 migrations do not recreate the prod database.
- R2 binding name is `UPLOADS_BUCKET`.

- [ ] **Step 5: Promote Alchemy app deployment**

After Steps 3 and 4 pass, disable Wrangler deploy triggers by changing each Wrangler workflow trigger to manual-only.

In `.github/workflows/cloudflare-dev-deploy.yml`, replace:

```yaml
on:
  pull_request:
    branches:
      - main
    types:
      - opened
      - synchronize
      - reopened
      - ready_for_review
  workflow_dispatch:
```

with:

```yaml
on:
  workflow_dispatch:
```

In `.github/workflows/cloudflare-prod-deploy.yml`, replace:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
```

with:

```yaml
on:
  workflow_dispatch:
```

- [ ] **Step 6: Add automatic Alchemy prod deploy**

In `.github/workflows/cloudflare-alchemy-deploy.yml`, replace the trigger block:

```yaml
on:
  workflow_dispatch:
    inputs:
      stage:
        description: Cloudflare stage to deploy
        required: true
        default: dev
        type: choice
        options:
          - dev
          - prod
```

with:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
    inputs:
      stage:
        description: Cloudflare stage to deploy
        required: true
        default: dev
        type: choice
        options:
          - dev
          - prod
```

Then change all `${{ inputs.stage }}` expressions that determine prod push behavior to this expression:

```yaml
${{ github.event_name == 'push' && 'prod' || inputs.stage }}
```

- [ ] **Step 7: Commit**

```bash
git add docs/deploy/cloudflare-d1.md .github/workflows/cloudflare-dev-deploy.yml .github/workflows/cloudflare-prod-deploy.yml .github/workflows/cloudflare-alchemy-deploy.yml
git commit -m "ci: promote alchemy cloudflare deployments"
```

---

## Self-Review

Spec coverage:
- Recommended split is covered: Alchemy app deployments in Tasks 1-3 and Terraform stable resources in Tasks 4-5.
- Existing Wrangler deploys remain intact until verification in Task 6.
- Cloudflare D1/R2 resources are imported before Terraform ownership and protected with `prevent_destroy`.
- Preview environments are stage-isolated with `pr-<number>`.

Placeholder scan:
- The plan avoids placeholder values for known resources by using existing D1 database IDs and bucket names from `apps/server/wrangler.jsonc`.
- Secrets and account IDs are intentionally read from the existing 1Password/GitHub environment pattern.

Type consistency:
- `getAlchemyStage()` and `cloudflareResourceNames(stage)` signatures are used consistently.
- Root scripts are named `deploy:alchemy`, `destroy:alchemy`, and `plan:alchemy` consistently.
