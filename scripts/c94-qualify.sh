#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
node --test tests/c94-*.test.mjs
node scripts/c94-falsify.mjs 120000
node scripts/c94-targeted-attack.mjs 12000 --require-clean
node scripts/c94-derivative-falsify.mjs 12000
