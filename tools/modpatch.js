// Tao ban "mod": src/index.vi.js  ->  src/index.mod.js
//
// Ban mod giu nguyen 100% chuc nang cua ban Viet hoa, chi them mot quy trinh moi
// "Mod the co san": ap dung khoi MVU / zod / thanh trang thai len mot the nhan vat
// va sach the gioi DA CO SAN, khong sinh lai noi dung bang AI.
//
// Toan bo thay doi deu di qua AST (@babel/parser + @babel/traverse); moi diem chen
// deu duoc kiem tra so luong, sai la dung ngay.
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const SRC = process.argv[2] || "src/index.vi.js";
const OUT = process.argv[3] || "src/index.mod.js";
const VIEW = path.join(__dirname, "mod", "modview.src.js");

const src = fs.readFileSync(SRC, "utf8");
const ast = parser.parse(src, { sourceType: "module", ranges: true });

const edits = [];
const add = (start, end, text, tag) => edits.push({ start, end, text, tag });
const txt = (node) => src.slice(node.start, node.end);
const die = (m) => {
  console.error("LOI modpatch: " + m);
  process.exit(1);
};
const one = (arr, what) => {
  if (arr.length !== 1) die(`can dung 1 ${what}, tim thay ${arr.length}`);
  return arr[0];
};

// ---------------------------------------------------------------- thu thap
const isVueCall = (node, name) =>
  node.type === "CallExpression" &&
  node.callee.type === "SequenceExpression" &&
  node.callee.expressions.length === 2 &&
  node.callee.expressions[1].type === "MemberExpression" &&
  node.callee.expressions[1].property.type === "Identifier" &&
  node.callee.expressions[1].property.name === name;

const appMainProps = [];
const emitsArrays = [];
const enterBeginnerCalls = [];
const onEnterBeginnerProps = [];
const setupTernaries = [];
const headerComputeds = [];
const homeFns = [];
const mvuRuntimeJson = [];
const draftKeyTemplates = [];
const buttonNameCalls = [];
const idbNames = [];

traverse(ast, {
  ObjectProperty(p) {
    const k = p.node.key;
    const kn = k.type === "Identifier" ? k.name : k.type === "StringLiteral" ? k.value : null;
    if (kn === "class" && p.node.value.type === "StringLiteral" && p.node.value.value === "app-main")
      appMainProps.push(p);
    if (kn === "emits" && p.node.value.type === "ArrayExpression") {
      const vals = p.node.value.elements.map((e) => (e && e.type === "StringLiteral" ? e.value : null));
      if (vals.includes("enter-beginner") && vals.includes("enter-editor")) emitsArrays.push(p.node.value);
    }
    if (kn === "onEnterBeginner") onEnterBeginnerProps.push(p);
  },
  StringLiteral(p) {
    const v = p.node.value;
    if (v === "enter-beginner") enterBeginnerCalls.push(p);
    if (v.includes('"961f366d-e403-45c2-8155-3d14ec86de53"') && v.includes("MagVarUpdate")) mvuRuntimeJson.push(p.node);
    if (v === "one-click-card-writer") idbNames.push(p.node);
  },
  TemplateElement(p) {
    if (p.node.value.cooked && p.node.value.cooked.startsWith("tamamo-card-writer:draft:v1:")) draftKeyTemplates.push(p.node);
  },
  ConditionalExpression(p) {
    const t = p.node.test;
    if (
      t.type === "BinaryExpression" &&
      t.operator === "===" &&
      t.left.type === "StringLiteral" &&
      t.left.value === "setup" &&
      t.right.type === "MemberExpression" &&
      t.right.property.type === "Identifier" &&
      t.right.property.name === "value" &&
      /createBlock/.test(txt(p.node.consequent))
    )
      setupTernaries.push(p);
  },
  CallExpression(p) {
    if (isVueCall(p.node, "computed") && p.node.arguments.length === 1) {
      const fn = p.node.arguments[0];
      if (fn.type === "ArrowFunctionExpression" && fn.body.type === "ConditionalExpression") {
        const s = txt(fn.body);
        if (/"persona" === /.test(s) && /"editor" === /.test(s) && /"opening" === /.test(s) && /"beginner" === /.test(s))
          headerComputeds.push(fn.body);
      }
    }
    const cn = p.node.callee.type === "Identifier" ? p.node.callee.name : null;
    if (cn === "replaceScriptButtons" || cn === "getButtonEvent") buttonNameCalls.push(p.node);
  },
  FunctionDeclaration(p) {
    const s = txt(p.node);
    if (p.node.params.length === 0 && /\.value = "setup"\)\);?\s*\}$/.test(s) && s.length < 160) homeFns.push(p.node);
  },
});

// ------------------------------------------------------- 1. chen ModView
const appMain = one(appMainProps, 'thuoc tinh class:"app-main"');
let stmt = appMain;
while (stmt.parentPath && !stmt.parentPath.isProgram() && !stmt.isStatement()) stmt = stmt.parentPath;
while (stmt.parentPath && !stmt.parentPath.isBlockStatement() && !stmt.parentPath.isProgram()) stmt = stmt.parentPath;
if (!stmt.isStatement()) die("khong xac dinh duoc cau lenh chua class:app-main");

const runtimeJson = one(mvuRuntimeJson, "chuoi JSON runtime MVU");
let view = fs.readFileSync(VIEW, "utf8");
if (!view.includes('"__QZ_MVU_RUNTIME_JSON__"')) die("modview.src.js thieu cho danh cho JSON runtime MVU");
view = view.replace('"__QZ_MVU_RUNTIME_JSON__"', txt(runtimeJson));
parser.parse(view, { sourceType: "module" }); // kiem tra cu phap truoc khi chen
add(stmt.node.start, stmt.node.start, view + "\n", "chen ModView");

// -------------------------------------------- 2. emits cua SetupView
const emits = one(emitsArrays, "mang emits cua SetupView");
const lastEmit = emits.elements[emits.elements.length - 1];
add(lastEmit.end, lastEmit.end, ', "enter-mod"', "emits enter-mod");

// ------------------------------------ 3. nut quy trinh thu 4 trong SetupView
const beginnerLit = one(enterBeginnerCalls.filter((p) => p.parentPath.isCallExpression()), 'loi goi a("enter-beginner")');
let btn = beginnerLit;
while (btn && !(isVueCall(btn.node, "createElementVNode") && btn.node.arguments[0]?.value === "button")) btn = btn.parentPath;
if (!btn) die("khong tim thay vnode nut enter-beginner");
const list = btn.parentPath;
if (!list.isArrayExpression()) die("nut quy trinh khong nam trong mang con");
const lastBtn = list.node.elements[list.node.elements.length - 1];
const MOD_BUTTON_HTML =
  '<span class="workflow-icon secondary-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3"></path>' +
  '<circle cx="15" cy="6" r="2"></circle><circle cx="9" cy="12" r="2"></circle><circle cx="15" cy="18" r="2"></circle>' +
  "</svg></span>" +
  "<span class=\"workflow-copy\"><strong>Mod thẻ có sẵn</strong>" +
  "<small>Thêm biến MVU, cấu trúc zod và thanh trạng thái vào thẻ bạn đã làm xong</small>" +
  '<span class="workflow-tags"><i>Không sinh lại nội dung</i><i>Chỉ ghi thêm</i></span></span>' +
  '<span class="workflow-enter">Mở <b>→</b></span>';
const modButton =
  ',(0, r.createElementVNode)("button",{class:"workflow-option mod-workflow",' +
  "disabled: n.isBusy || !n.canEnterEditor," +
  'onClick: () => a("enter-mod")},' +
  "[(0, r.createStaticVNode)(" +
  JSON.stringify(MOD_BUTTON_HTML) +
  ",3)],8,[\"disabled\"])";
add(lastBtn.end, lastBtn.end, modButton, "nut quy trinh Mod");

// ------------------------------- 4. ham chuyen man hinh + prop onEnterMod
const home = one(homeFns, "ham quay ve man hinh setup");
const enterMod = txt(home)
  .replace(/^function\s+[A-Za-z0-9_$]+\s*\(/, "function qzEnterModView(")
  .replace('"setup"', '"mod"');
parser.parse(enterMod, { sourceType: "module" });
add(home.end, home.end, "\n" + enterMod, "ham qzEnterModView");

const onEnterBeginner = one(onEnterBeginnerProps, "prop onEnterBeginner");
add(onEnterBeginner.node.end, onEnterBeginner.node.end, ", onEnterMod: qzEnterModView", "prop onEnterMod");

// -------------------------------------------- 5. nhanh render cho man hinh mod
const setupTernary = one(setupTernaries, "nhanh render cua SetupView");
const stepRef = setupTernary.node.test.right.object;
if (stepRef.type !== "Identifier") die("khong doc duoc bien buoc hien tai");

const setupProps = onEnterBeginner.parentPath.node;
if (setupProps.type !== "ObjectExpression") die("khong doc duoc bang props cua SetupView");
const propOf = (name) => {
  const hit = setupProps.properties.filter((x) => {
    const k = x.key;
    return (k.type === "Identifier" ? k.name : k.value) === name;
  });
  if (hit.length !== 1) die(`can dung 1 prop ${name} cua SetupView, tim thay ${hit.length}`);
  return txt(hit[0].value);
};
const charExpr = propOf("current-character");
const bookExpr = propOf("worldbook-name");
const busyExpr = propOf("is-busy");
const bookRef = bookExpr.match(/^([A-Za-z0-9_$]+)\.value$/u);
if (!bookRef) die("prop worldbook-name khong phai dang <ref>.value: " + bookExpr);
const homeName = home.id && home.id.name;
if (!homeName) die("ham quay ve man hinh setup khong co ten");

const MOD_BRANCH =
  `"mod" === ${stepRef.name}.value` +
  " ? ((0, r.openBlock)(), (0, r.createBlock)(QzModView, {" +
  "key: 90," +
  ` "current-character": ${charExpr},` +
  ` "worldbook-name": ${bookExpr},` +
  ` "is-busy": ${busyExpr},` +
  ` "onUpdate:worldbookName": (v) => (${bookRef[1]}.value = v),` +
  ` onBack: ${homeName}` +
  '}, null, 8, ["current-character", "worldbook-name", "is-busy"])) : ';
add(setupTernary.node.start, setupTernary.node.start, MOD_BRANCH, "nhanh render mod");

// ----------------------------------- 6. tieu de o thanh dau trang cho man hinh mod
if (headerComputeds.length !== 3) die(`can 3 computed tieu de, tim thay ${headerComputeds.length}`);
headerComputeds.sort((a, b) => a.start - b.start);
const HEADER_TEXT = [
  '"MOD EXISTING CARD"',
  '"Mod thẻ nhân vật có sẵn"',
  '"Chỉ thêm biến MVU, cấu trúc zod và thanh trạng thái vào thẻ đã có"',
];
headerComputeds.forEach((node, i) => {
  add(node.start, node.start, `"mod" === ${stepRef.name}.value ? ${HEADER_TEXT[i]} : `, "tieu de mod " + i);
});

// ------------------------------------- 7. tach ten nut / bo nho nhap khoi ban goc
for (const call of buttonNameCalls) {
  traverse(
    { type: "File", program: { type: "Program", body: [{ type: "ExpressionStatement", expression: call }], directives: [], sourceType: "module" } },
    {
      noScope: true,
      StringLiteral(p) {
        if (p.node.value === "Trình tạo thẻ nhân vật một chạm")
          add(p.node.start, p.node.end, JSON.stringify("Trình tạo thẻ nhân vật một chạm (mod)"), "ten nut");
      },
    },
  );
}
for (const te of draftKeyTemplates)
  add(te.start, te.end, src.slice(te.start, te.end).replace("tamamo-card-writer:", "tamamo-card-writer-mod:"), "khoa ban nhap");
for (const s of idbNames) add(s.start, s.end, JSON.stringify("one-click-card-writer-mod"), "ten kho IndexedDB");

// ---------------------------------------------------------------- ap dung
edits.sort((a, b) => b.start - a.start || b.end - a.end);
let out = src;
for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
fs.writeFileSync(OUT, out);
console.log(`Da tao ${OUT} (${edits.length} diem chen):`);
for (const e of [...edits].reverse()) console.log("  - " + e.tag);
