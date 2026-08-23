// Kiem tra ban mod: src/index.mod.js phai la src/index.vi.js CONG THEM man hinh mod,
// khong duoc mat mat bat ky noi dung nao cua ban Viet hoa.
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const acorn = require("acorn");

const VI = process.argv[2] || "src/index.vi.js";
const MOD = process.argv[3] || "src/index.mod.js";
let fail = 0;
const ok = (m) => console.log("  OK   " + m);
const bad = (m) => {
  console.log("  LOI  " + m);
  fail++;
};
const section = (m) => console.log("\n" + m);

const vi = fs.readFileSync(VI, "utf8");
const mod = fs.readFileSync(MOD, "utf8");

section("1. Cu phap (hai bo phan tich doc lap)");
try {
  acorn.parse(mod, { ecmaVersion: "latest", sourceType: "module" });
  ok("acorn phan tich duoc");
} catch (e) {
  bad("acorn: " + e.message);
}
let astMod;
try {
  astMod = parser.parse(mod, { sourceType: "module" });
  ok("@babel/parser phan tich duoc");
} catch (e) {
  bad("babel: " + e.message);
  process.exit(1);
}
const astVi = parser.parse(vi, { sourceType: "module" });

function harvest(ast) {
  const strings = [];
  const types = [];
  traverse(ast, {
    enter(p) {
      types.push(p.node.type);
      if (p.node.type === "StringLiteral") strings.push(p.node.value);
      if (p.node.type === "TemplateElement") strings.push("`" + p.node.value.cooked);
      if (p.node.type === "RegExpLiteral") strings.push("/" + p.node.pattern + "/" + p.node.flags);
    },
  });
  return { strings, types };
}
const a = harvest(astVi);
const b = harvest(astMod);

section("2. Khong mat noi dung: chuoi cua ban Viet hoa phai con nguyen");
const count = (arr) => {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
  return m;
};
const ca = count(a.strings);
const cb = count(b.strings);
// Ba chuoi duoi day CO CHU DICH doi ten de ban mod khong dung nut / bo nho nhap voi ban goc.
const EXPECTED_MISSING = {
  "Trình tạo thẻ nhân vật một chạm": 2,
  "one-click-card-writer": 2,
  "`tamamo-card-writer:draft:v1:": 1,
};
const missing = [];
for (const [k, n] of ca) {
  const d = n - (cb.get(k) || 0);
  if (d > 0) missing.push([k, d]);
}
let missOk = true;
for (const [k, d] of missing) {
  if (EXPECTED_MISSING[k] === d) continue;
  missOk = false;
  bad(`mat chuoi: ${JSON.stringify(k).slice(0, 90)} (thieu ${d})`);
}
for (const k of Object.keys(EXPECTED_MISSING)) {
  if (!missing.some(([x]) => x === k)) {
    missOk = false;
    bad(`chua doi ten chuoi ${JSON.stringify(k)} — ban mod se dung nut/bo nho voi ban goc`);
  }
}
if (missOk) ok(`chi 3 chuoi duoc doi ten co chu y, ${ca.size} chuoi con lai giu nguyen`);

section("3. Khong mat cau truc: cay AST cua ban Viet hoa nam tron trong ban mod");
let i = 0;
for (const t of b.types) {
  if (i < a.types.length && a.types[i] === t) i++;
}
if (i === a.types.length) ok(`${a.types.length} nut AST cua ban Viet hoa deu con (ban mod: ${b.types.length})`);
else bad(`AST ban Viet hoa bi cat: khop duoc ${i}/${a.types.length} nut`);

section("4. Phan them vao");
const added = [];
for (const [k, n] of cb) {
  const d = n - (ca.get(k) || 0);
  if (d > 0) added.push([k, d]);
}
const CJK = /[一-鿿]/u;
// "世界" duoc giu lai co chu y: de nhan ra the cu dung bien MVU tieng Trung.
const CJK_ALLOW = new Set(["世界"]);
// Chuoi da co san trong ban Viet hoa (vi du JSON runtime MVU) duoc phep xuat hien them lan nua.
const cjkAdded = added.filter(([k]) => CJK.test(k) && !CJK_ALLOW.has(k) && !ca.has(k));
if (cjkAdded.length === 0) ok(`${added.length} chuoi moi, khong chuoi nao lot chu Han`);
else cjkAdded.forEach(([k]) => bad("chuoi moi con chu Han: " + JSON.stringify(k).slice(0, 90)));

section("5. Diem noi cua man hinh mod");
const seen = { decl: 0, useBlock: 0, emit: 0, emitsEntry: 0, prop: 0, fnDecl: 0, fnUse: 0, stepMod: 0 };
traverse(astMod, {
  VariableDeclarator(p) {
    if (p.node.id.type === "Identifier" && p.node.id.name === "QzModView") seen.decl++;
  },
  Identifier(p) {
    if (p.node.name === "QzModView" && p.parent.type === "CallExpression") seen.useBlock++;
    if (p.node.name === "qzEnterModView") {
      if (p.parent.type === "FunctionDeclaration") seen.fnDecl++;
      else seen.fnUse++;
    }
  },
  StringLiteral(p) {
    if (p.node.value !== "enter-mod") return;
    if (p.parent.type === "ArrayExpression") seen.emitsEntry++;
    else seen.emit++;
  },
  ObjectProperty(p) {
    const k = p.node.key;
    if ((k.type === "Identifier" ? k.name : k.value) === "onEnterMod") seen.prop++;
  },
  BinaryExpression(p) {
    if (p.node.left.type === "StringLiteral" && p.node.left.value === "mod" && p.node.operator === "===") seen.stepMod++;
  },
});
const want = { decl: 1, useBlock: 1, emit: 1, emitsEntry: 1, prop: 1, fnDecl: 1, fnUse: 1, stepMod: 4 };
for (const k of Object.keys(want)) {
  if (seen[k] === want[k]) ok(`${k} = ${seen[k]}`);
  else bad(`${k} = ${seen[k]}, mong doi ${want[k]}`);
}

section("6. Man hinh mod chi goi cac ham co that trong bundle");
const NEEDED = ["Er", "ur", "hr", "Ai", "oi", "Dr", "Rr", "Hr", "Wr", "Vr", "zr", "Fo", "Pr"];
const declared = new Set();
traverse(astMod, {
  FunctionDeclaration(p) {
    if (p.node.id) declared.add(p.node.id.name);
  },
});
const lack = NEEDED.filter((n) => !declared.has(n));
if (lack.length === 0) ok(`${NEEDED.length} ham dung chung deu ton tai: ` + NEEDED.join(", "));
else bad("thieu ham: " + lack.join(", "));

section(fail === 0 ? "TAT CA DEU DAT" : `CO ${fail} LOI`);
process.exit(fail === 0 ? 0 : 1);
