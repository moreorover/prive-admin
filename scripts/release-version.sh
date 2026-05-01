#!/usr/bin/env bash
set -euo pipefail

bunx changeset version

new_version=$(node -p "require('./apps/web/package.json').version")

node -e "
  const fs = require('fs');
  const path = './package.json';
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = '${new_version}';
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"

echo "Synced root package.json to ${new_version}"
