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
