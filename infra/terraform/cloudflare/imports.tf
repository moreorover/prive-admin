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
