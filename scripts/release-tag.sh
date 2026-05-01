#!/usr/bin/env bash
set -euo pipefail

version=$(node -p "require('./package.json').version")
tag="v${version}"

if git rev-parse "${tag}" >/dev/null 2>&1; then
  echo "Tag ${tag} already exists, skipping"
  exit 0
fi

git tag "${tag}"
echo "🦋  New tag: ${tag}"
