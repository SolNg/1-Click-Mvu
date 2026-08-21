#!/bin/sh
# Chay toan bo vong kiem tra: dung lai + kiem tra tinh + chay that trong trinh duyet.
set -e
cd "$(dirname "$0")/.."
echo "===== 1. Dung lai va kiem tra tinh ====="
./tools/build.sh
echo
echo "===== 2. Audit doc lap ====="
node tools/audit.js
echo
echo "===== 3. Chay that trong Chromium ====="
node tools/smoke/run.js | tail -8
echo
echo "===== 4. Do layout o moi breakpoint ====="
echo "--- ban goc (tieng Trung) ---"
node tools/smoke/breakpoints.js src/index.formatted.js || true
echo
echo "--- ban Viet hoa ---"
node tools/smoke/breakpoints.js src/index.vi.js
