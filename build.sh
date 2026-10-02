#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Package only runtime files and the required license, without ZIP extra fields.
node -e 'JSON.parse(require("fs").readFileSync("src/info.json", "utf8"))'
node --check src/main.js
output="bob-openai-compatible-translate.bobplugin"
rm -f "$output"
(cd src && zip -X -q "../$output" main.js info.json)
zip -X -q "$output" LICENSE
unzip -t "$output"
printf 'Built %s\n' "$output"
