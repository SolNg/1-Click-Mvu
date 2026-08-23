#!/bin/sh
# Vong kiem tra day du cho ban mod: dung lai + kiem tra tinh + chay that trong Chromium.
set -e
cd "$(dirname "$0")/.."
echo "===== 1. Dung lai ban mod va kiem tra tinh ====="
./tools/build-mod.sh
echo
echo "===== 2. Chay that man hinh mod trong Chromium ====="
node tools/smoke/mod.js
