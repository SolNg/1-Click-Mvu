// Sinh lai tools/smoke/bundle.test.js tu ban dich hien tai (doi import pinia sang shim cuc bo).
const fs = require("fs");
const path = require("path");
module.exports = function prepare(target = "src/index.vi.js") {
  const ROOT = path.resolve(__dirname, "../..");
  const src = fs.readFileSync(path.join(ROOT, target), "utf8");
  const patched = src.replace(/^import \{ createPinia as n \} from "[^"]+";/m, 'import { createPinia as n } from "./pinia-shim.js";');
  if (patched === src) throw new Error("Khong doi duoc import pinia");
  fs.writeFileSync(path.join(__dirname, "bundle.test.js"), patched);
  return ROOT;
};
