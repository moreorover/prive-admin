#!/usr/bin/env python3
"""Convert a Prisma pg_dump backup to Drizzle-compatible data-only SQL.

Usage: python3 scripts/convert_prisma_backup.py backups/<backup-file>.sql
Output: backups/postgres_backup_drizzle.sql
"""

import re
import sys

if len(sys.argv) != 2:
    print("Usage: python3 scripts/convert_prisma_backup.py <backup.sql>")
    sys.exit(1)

input_file = sys.argv[1]

with open(input_file, "r") as f:
    content = f.read()

# Extract COPY data blocks
blocks = {}
lines = content.split("\n")
i = 0
while i < len(lines):
    line = lines[i]
    if line.startswith("COPY public."):
        match = re.match(r"COPY public\.(\w+) \((.+)\) FROM stdin;", line)
        if match:
            table = match.group(1)
            cols_str = match.group(2)
            data_lines = []
            i += 1
            while i < len(lines) and lines[i] != "\\.":
                data_lines.append(lines[i])
                i += 1
            blocks[table] = {"cols": cols_str, "data": data_lines}
    i += 1

# camelCase -> snake_case column mapping
COL_MAP = {
    "accountId": "account_id",
    "providerId": "provider_id",
    "userId": "user_id",
    "accessToken": "access_token",
    "refreshToken": "refresh_token",
    "idToken": "id_token",
    "accessTokenExpiresAt": "access_token_expires_at",
    "refreshTokenExpiresAt": "refresh_token_expires_at",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "appointmentId": "appointment_id",
    "personnelId": "personnel_id",
    "startsAt": "starts_at",
    "clientId": "client_id",
    "phoneNumber": "phone_number",
    "hairOrderId": "hair_order_id",
    "weightInGrams": "weight_in_grams",
    "soldFor": "sold_for",
    "pricePerGram": "price_per_gram",
    "createdById": "created_by_id",
    "placedAt": "placed_at",
    "arrivedAt": "arrived_at",
    "weightReceived": "weight_received",
    "weightUsed": "weight_used",
    "customerId": "customer_id",
    "orderId": "order_id",
    "productVariantId": "product_variant_id",
    "unitPrice": "unit_price",
    "totalPrice": "total_price",
    "productId": "product_id",
    "expiresAt": "expires_at",
    "ipAddress": "ip_address",
    "userAgent": "user_agent",
    "completedDateBy": "completed_date_by",
    "emailVerified": "email_verified",
}


def rename_cols(cols_str):
    cols = [c.strip().strip('"') for c in cols_str.split(",")]
    return ", ".join(COL_MAP.get(c, c) for c in cols)


# Insert order respects FK dependencies (parents first)
TABLE_ORDER = [
    "users",
    "customer",
    "product",
    "accounts",
    "sessions",
    "verifications",
    "appointment",
    "appointment_personnel",
    "product_variant",
    "order",
    "order_item",
    "hair_order",
    "hair_assigned",
    "transaction",
    "note",
]

# Prisma plural -> Drizzle singular table name mapping
TABLE_RENAME = {
    "customers": "customer",
    "products": "product",
    "appointments": "appointment",
    "product_variants": "product_variant",
    "orders": "order",
    "order_items": "order_item",
    "hair_orders": "hair_order",
    "transactions": "transaction",
    "notes": "note",
}

out = []
out.append("-- Drizzle-compatible data restore")
out.append("-- Assumes schema already exists via drizzle-kit migrate")
out.append(f"-- Converted from: {input_file}")
out.append("")
out.append("SET client_encoding = 'UTF8';")
out.append("SET standard_conforming_strings = on;")
out.append("")

for table in TABLE_ORDER:
    # Look up data using the old Prisma name if this table was renamed
    old_name = next((k for k, v in TABLE_RENAME.items() if v == table), table)
    source = old_name if old_name in blocks else table
    if source not in blocks or not blocks[source]["data"]:
        continue
    info = blocks[source]
    new_cols = rename_cols(info["cols"])
    out.append(f"-- Data for: {table}")
    out.append(f"COPY public.{table} ({new_cols}) FROM stdin;")
    for row in info["data"]:
        out.append(row)
    out.append("\\.")
    out.append("")

# Reset hair_order uid sequence
seq_match = re.search(
    r"SELECT pg_catalog\.setval\('public\.hair_orders_uid_seq',\s*(\d+),\s*(true|false)\);",
    content,
)
if seq_match:
    out.append(
        f"SELECT pg_catalog.setval('public.hair_order_uid_seq', {seq_match.group(1)}, {seq_match.group(2)});"
    )
    out.append("")

output_file = "backups/postgres_backup_drizzle.sql"
with open(output_file, "w") as f:
    f.write("\n".join(out))

print(f"Converted {len(blocks)} tables -> {output_file}")
