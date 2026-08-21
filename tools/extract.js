// Trich xuat moi chuoi chua chu Han kem offset tuyet doi, de dich va thay the bang AST.
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const SRC = process.argv[2] || "src/index.formatted.js";
const OUT = process.argv[3] || "i18n/strings.json";
const code = fs.readFileSync(SRC, "utf8");
const ast = parser.parse(code, { sourceType: "module", ranges: true });

const CJK = /[㐀-䶿一-鿿豈-﫿　-〿＀-￯]/;
const PRESET_LINE = 4244; // chuoi JSON preset - xu ly rieng

const items = [];
function add(node, value, kind, ctx) {
  if (!CJK.test(value)) return;
  if (node.loc.start.line === PRESET_LINE) return;
  items.push({
    id: `${node.start}`,
    start: node.start,
    end: node.end,
    line: node.loc.start.line,
    kind,
    ctx,
    zh: value,
    vi: null,
  });
}
function ctxOf(path) {
  const p = path.parentPath;
  if (!p) return "root";
  const t = p.node.type;
  if (t === "ObjectProperty") {
    if (p.node.key === path.node) return "OBJ_KEY";
    return "OBJ_VALUE:" + (p.node.key.name || p.node.key.value);
  }
  if (t === "CallExpression") {
    const c = p.node.callee;
    let name = c.type === "Identifier" ? c.name
      : c.type === "MemberExpression" ? (c.object.name || "?") + "." + (c.property.name || c.property.value)
      : c.type === "SequenceExpression" ? (() => { const l = c.expressions.at(-1); return l.type === "MemberExpression" ? (l.object.name || "?") + "." + (l.property.name || l.property.value) : "?"; })()
      : "?";
    return "CALL:" + name + "#" + p.node.arguments.indexOf(path.node);
  }
  if (t === "NewExpression") return "NEW";
  if (t === "ArrayExpression") return "ARRAY";
  return t;
}
traverse(ast, {
  StringLiteral(path) { add(path.node, path.node.value, "str", ctxOf(path)); },
  TemplateElement(path) {
    const tplPath = path.parentPath;
    add(path.node, path.node.value.cooked, "tpl", ctxOf(tplPath));
  },
});
items.sort((a, b) => a.start - b.start);
fs.writeFileSync(OUT, JSON.stringify(items, null, 1));
console.log("Trich xuat:", items.length, "chuoi |", items.reduce((s, i) => s + i.zh.length, 0), "ky tu");
