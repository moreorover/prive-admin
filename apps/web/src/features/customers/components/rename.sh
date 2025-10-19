#!/usr/bin/env zsh
# rename_customers_to_customers.zsh
# Renames files in the current directory: *customers* -> *customers*

set -euo pipefail
setopt NULL_GLOB  # if no matches, the glob expands to nothing (no error)

# Case-sensitive (change pattern below to *(#i)customers* for case-insensitive)
for f in *customers*(.N); do                # (.N) = regular files only, null if none
  new="${f//customers/customers}"           # replace all occurrences
  if [[ "$f" == "$new" ]]; then
    continue
  fi
  if [[ -e "$new" ]]; then
    echo "Skip: '$new' already exists" >&2
    continue
  fi
  echo "Renaming: '$f' -> '$new'"
  mv "$f" "$new"
done

echo "Done."