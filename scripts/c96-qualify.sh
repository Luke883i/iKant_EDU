#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
node --test tests/c94-zip-c77.test.mjs tests/c94-carrier-proof.test.mjs tests/c94-derived-provenance.test.mjs tests/c94-full-transport.test.mjs tests/c94-native-boundary.test.mjs tests/c95-bridge-hardening.test.mjs tests/c96-parallel-carrier.test.mjs tests/c96-hardening.test.mjs
node scripts/c96-falsify-10m.mjs 10000000
