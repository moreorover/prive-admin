#!/usr/bin/env zsh
# replace_customer_in_files.zsh
# In-file replacements in current dir:
#   "Customer" -> "Customer"
#   "customer" -> "customer"
# Skips binary files.

set -euo pipefail
setopt NULL_GLOB

# Optional: set a backup extension (e.g., ".bak") or leave empty for no backups
BACKUP_EXT=".bak"

# List regular files in current dir that contain 'Customer' or 'customer' and are not binary
files=($(grep -IlE 'Customer|customer' -- *(.N) 2>/dev/null || true))

if (( ${#files} == 0 )); then
  echo "No matching text files found in the current directory."
  exit 0
fi

echo "Will update ${#files} file(s):"
printf ' - %s\n' $files

# Do the replacements (order doesn't matter here)
for f in $files; do
  if [[ -n "$BACKUP_EXT" ]]; then
    perl -0777 -i"$BACKUP_EXT" -pe 's/Customer/Customer/g; s/customer/customer/g' -- "$f"
  else
    perl -0777 -i -pe 's/Customer/Customer/g; s/customer/customer/g' -- "$f"
  fi
done

echo "Done."
[[ -n "$BACKUP_EXT" ]] && echo "Backups created with extension: $BACKUP_EXT"
