// Tach chuoi JSON preset (dong 4244) ra file rieng de dich.
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const code = fs.readFileSync("src/index.formatted.js", "utf8");
const ast = parser.parse(code, { sourceType: "module", ranges: true });
let node = null;
traverse(ast, { StringLiteral(p) { if (p.node.loc.start.line === 4244) node = p.node; } });
if (!node) throw new Error("Khong tim thay chuoi preset o dong 4244");
const preset = JSON.parse(node.value);
fs.writeFileSync("i18n/preset.zh.json", JSON.stringify(preset, null, 2));
fs.writeFileSync("i18n/preset.offset.json", JSON.stringify({ start: node.start, end: node.end }));
console.log("prompts:", preset.prompts.length, "| offset:", node.start, "-", node.end);
