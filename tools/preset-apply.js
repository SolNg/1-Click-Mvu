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
console.log(`Preset: da dich ${nName} ten prompt, ${nContent} noi dung prompt`);
