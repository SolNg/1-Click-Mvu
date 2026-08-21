#!/bin/sh
# Dung lai src/index.vi.js tu src/index.formatted.js + ban dich + patch code + lop CSS.
set -e
cd "$(dirname "$0")/.."
node tools/merge.js
node tools/apply.js
node tools/codepatch.js
node tools/csstune.js
node tools/verify.js
