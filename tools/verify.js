// Kiem tra 2 tang: acorn + babel, so sanh cau truc AST, doi chieu chuoi khoa.
const fs = require("fs");
const acorn = require("acorn");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const A = process.argv[2] || "src/index.formatted.js";
const B = process.argv[3] || "src/index.vi.js";
let fail = 0;
const ok = (m) => console.log("  OK   " + m);
const bad = (m) => { console.log("  LOI  " + m); fail++; };

const a = fs.readFileSync(A, "utf8");
const b = fs.readFileSync(B, "utf8");

// 1. acorn parse
let acornAst = null;
try {
  acornAst = acorn.parse(b, { ecmaVersion: "latest", sourceType: "module", locations: true });
  ok("acorn parse thanh cong");
} catch (e) {
  bad("acorn parse THAT BAI: " + e.message + (e.loc ? ` (dong ${e.loc.line}:${e.loc.column})` : ""));
}
// 2. babel parse
let babelB = null;
try {
  babelB = parser.parse(b, { sourceType: "module" });
  ok("babel parse thanh cong");
} catch (e) {
  bad("babel parse THAT BAI: " + e.message);
}
if (!babelB) { console.log(`\n=> ${fail} loi`); process.exit(1); }

// 3. So sanh chuoi node type (bo qua gia tri chuoi)
function shape(src) {
  const ast = parser.parse(src, { sourceType: "module" });
  const seq = [];
  traverse(ast, { enter(p) { seq.push(p.node.type); } });
  return seq;
}
const sa = shape(a), sb = shape(b);
if (sa.length !== sb.length) {
  bad(`So luong node khac nhau: goc ${sa.length} vs moi ${sb.length}`);
  for (let i = 0; i < Math.min(sa.length, sb.length); i++)
    if (sa[i] !== sb[i]) { bad(`  lech dau tien o node #${i}: ${sa[i]} -> ${sb[i]}`); break; }
} else {
  let diff = 0;
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) { if (diff === 0) bad(`Node type lech o #${i}: ${sa[i]} -> ${sb[i]}`); diff++; }
  if (diff === 0) ok(`Cau truc AST giong het (${sa.length} node)`);
}

// 4. Doi chieu chuoi KHOA (phai khong doi)
const LOCKED = JSON.parse(fs.readFileSync("i18n/locked.json", "utf8"));
let lockFail = 0;
for (const s of LOCKED) {
  const ca = (a.split(s).length - 1), cb = (b.split(s).length - 1);
  if (cb < ca) { bad(`Chuoi khoa bi mat/doi: ${JSON.stringify(s)} (goc ${ca} lan -> moi ${cb} lan)`); lockFail++; }
}
if (!lockFail) ok(`${LOCKED.length} chuoi khoa con nguyen`);

// 5. Kiem tra chu Han con sot trong vung DA dich
const items = JSON.parse(fs.readFileSync("i18n/strings.json", "utf8"));
const done = items.filter((i) => i.vi);
const CJK = /[一-鿿]/;
let leftover = done.filter((i) => CJK.test(i.vi)).length;
if (leftover) bad(`${leftover} ban dich van con chu Han`);
else ok(`${done.length} ban dich khong con chu Han`);

// 6. Bao cao chu Han con lai trong file ket qua (tru anh base64 va sourcemap)
const lines = b.split("\n");
const CJKG = /[一-鿿]/g;
let rest = 0;
const restLines = [];
lines.forEach((l, i) => {
  const m = l.match(CJKG);
  if (m) { rest += m.length; restLines.push(`${i + 1} (${m.length})`); }
});
if (rest) console.log(`  CON ${rest} chu Han o ${restLines.length} dong: ${restLines.slice(0, 14).join(", ")}${restLines.length > 14 ? " ..." : ""}`);
else ok("Khong con chu Han nao trong file ket qua");

console.log(`\n=> ${fail === 0 ? "TAT CA DAT" : fail + " loi"}`);
process.exit(fail ? 1 : 0);
