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
