#!/bin/sh
# Dung ban mod: src/index.mod.js = src/index.vi.js + man hinh "Mod the co san".
# Chay ./tools/build.sh truoc neu src/index.vi.js chua co hoac vua doi ban dich.
set -e
cd "$(dirname "$0")/.."
node tools/modpatch.js
prettier --write --print-width 120 --parser babel src/index.mod.js >/dev/null
node tools/verify-mod.js
