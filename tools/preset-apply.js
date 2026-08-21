// Ghi ban dich preset (i18n/preset.vi.json: identifier -> {name?, content?}) vao src/index.vi.js
const fs = require("fs");
const preset = JSON.parse(fs.readFileSync("i18n/preset.zh.json", "utf8"));
const vi = JSON.parse(fs.readFileSync("i18n/preset.vi.json", "utf8"));
const off = JSON.parse(fs.readFileSync("i18n/preset.offset.json", "utf8"));

let nName = 0, nContent = 0;
const byId = new Map(preset.prompts.map((p) => [String(p.identifier), p]));
for (const [id, patch] of Object.entries(vi)) {
  const p = byId.get(id);
  if (!p) throw new Error("identifier khong ton tai trong preset: " + id);
  if (patch.name != null) { p.name = patch.name; nName++; }
  if (patch.content != null) { p.content = patch.content; nContent++; }
}
// --- Nhanh extensions: va theo duong dan, khong dung identifier ---
const EXT = JSON.parse(fs.readFileSync("i18n/preset-extensions.json", "utf8"));
function at(root, path) {
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let o = root;
  for (const k of keys.slice(0, -1)) {
    if (o == null) return [null, null];
    o = o[k];
  }
  return [o, keys[keys.length - 1]];
}
let nExt = 0;
for (const [path, value] of Object.entries(EXT)) {
  if (path.startsWith("_")) continue;
  const [obj, key] = at(preset.extensions, path);
  if (!obj || !(key in obj)) throw new Error("preset.extensions: khong tim thay duong dan " + path);
  if (typeof obj[key] !== "string") throw new Error("preset.extensions: " + path + " khong phai chuoi");
  obj[key] = value;
  nExt++;
}
for (const [path, pairs] of Object.entries(EXT._thay_the_trong_chuoi || {})) {
  const [obj, key] = at(preset.extensions, path);
  if (!obj || typeof obj[key] !== "string") throw new Error("preset.extensions: khong tim thay " + path);
  for (const [a, b] of pairs) {
    if (!obj[key].includes(a)) throw new Error("preset.extensions: " + path + " khong chua " + a);
    obj[key] = obj[key].split(a).join(b);
    nExt++;
  }
}

const literal = JSON.stringify(JSON.stringify(preset, null, 2));
const src = fs.readFileSync("src/index.vi.js", "utf8");
// Offset lay tu file goc; sau khi dich cac chuoi khac offset da lech -> tim lai bang moc dau/cuoi.
// Xac dinh lai node bang parser (offset da lech sau khi dich cac chuoi khac).
const parser = require("@babel/parser");
const ast = parser.parse(src, { sourceType: "module", ranges: true });
const traverse = require("@babel/traverse").default;
let node = null;
traverse(ast, { StringLiteral(p) { if (p.node.value.startsWith('{\n  "max_context_unlocked"')) node = p.node; } });
if (!node) throw new Error("Khong xac dinh duoc node preset");
fs.writeFileSync("src/index.vi.js", src.slice(0, node.start) + literal + src.slice(node.end));
console.log(`Preset: da dich ${nName} ten prompt, ${nContent} noi dung prompt, ${nExt} muc trong extensions`);
