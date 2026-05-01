#!/usr/bin/env bash
set -euo pipefail

version=$(node -p "require('./package.json').version")
tag="v${version}"

if git rev-parse "${tag}" >/dev/null 2>&1; then
  echo "Tag ${tag} already exists, skipping"
  exit 0
fi

git tag "${tag}"
git push origin "${tag}"

if [[ -f apps/web/CHANGELOG.md ]]; then
  notes=$(awk -v ver="${version}" '
    $0 ~ "^## "ver"$" {flag=1; next}
    /^## / {flag=0}
    flag
  ' apps/web/CHANGELOG.md)
else
  notes=""
fi

if [[ -z "${notes}" ]]; then
  notes="Release ${tag}"
fi

gh release create "${tag}" --title "${tag}" --notes "${notes}"

echo "🦋  New tag: ${tag}"
