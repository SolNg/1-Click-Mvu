// Kiem tra bo sung: CSS hop le, khong doi chuoi ngoai danh sach dich, khong loi ma hoa.
const fs = require("fs");
const csstree = require("css-tree");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const A = fs.readFileSync("src/index.formatted.js", "utf8");
const B = fs.readFileSync("src/index.vi.js", "utf8");
let fail = 0;
const ok = (m) => console.log("  OK   " + m);
const bad = (m) => {
  console.log("  LOI  " + m);
  fail++;
};

const CJK = /[一-鿿]/;

// 1. CSS: so loi parse khong duoc nhieu hon ban goc
//    (ban goc san co 1 canh bao/khoi do css-tree chua ho tro "@supports not (A or B)")
function cssErrors(src) {
  const res = [];
  traverse(parser.parse(src, { sourceType: "module" }), {
    StringLiteral(p) {
      const v = p.node.value;
      if (v.length < 400) return;
      if (v.startsWith("{")) return; // JSON, khong phai CSS
      if (!/box-sizing|writer-shell/.test(v)) return;
      const errs = [];
      csstree.parse(v, { onParseError: (e) => errs.push(e.message) });
      res.push({ line: p.node.loc.start.line, n: errs.length, first: errs[0] });
    },
  });
  return res;
}
const ca = cssErrors(A);
const cb = cssErrors(B);
if (ca.length !== cb.length) {
  bad("So khoi CSS khac nhau: " + ca.length + " vs " + cb.length);
} else {
  let worse = 0;
  for (let i = 0; i < ca.length; i++) {
    if (cb[i].n > ca[i].n) {
      worse++;
      bad("CSS dong " + cb[i].line + " co them loi moi: " + cb[i].first);
    }
  }
  const base = ca.reduce((s, x) => s + x.n, 0);
  if (!worse) ok(ca.length + " khoi CSS: khong phat sinh loi moi (nen san co " + base + " canh bao)");
}

// 2. Doi chieu tung chuoi: chi cac chuoi da dich moi duoc phep khac
const items = JSON.parse(fs.readFileSync("i18n/strings.json", "utf8"));
const translated = new Set(items.filter((i) => i.vi != null && i.vi !== i.zh).map((i) => i.zh));
function strings(src) {
  const out = [];
  traverse(parser.parse(src, { sourceType: "module" }), {
    StringLiteral(p) {
      out.push(p.node.value);
    },
    TemplateElement(p) {
      out.push(p.node.value.cooked);
    },
  });
  return out;
}
const sa = strings(A);
const sb = strings(B);
if (sa.length !== sb.length) {
  bad("So luong chuoi khac: " + sa.length + " vs " + sb.length);
} else {
  let unexpected = 0;
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] === sb[i]) continue;
    if (translated.has(sa[i])) continue; // da dich qua i18n/strings.json
    if (CJK.test(sa[i])) continue; // patch inline (blob script) hoac preset
    if (sa[i].includes("max_context_unlocked")) continue; // preset JSON
    if (/Noto Sans SC|Noto Serif SC|Sarasa Mono|Microsoft YaHei|zh-CN|box-sizing|writer-shell/.test(sa[i])) continue;
    unexpected++;
    if (unexpected <= 5) {
      bad(
        "Chuoi doi ngoai y muon #" +
          i +
          ": " +
          JSON.stringify(sa[i]).slice(0, 90) +
          " -> " +
          JSON.stringify(sb[i]).slice(0, 90),
      );
    }
  }
  if (!unexpected) ok("Khong co chuoi nao bi doi ngoai danh sach dich (" + sa.length + " chuoi)");
}

// 3. Khong co loi ma hoa (mojibake) trong ban dich
const MOJI = /Ã[-¿]|�/;
const moji = items.filter((i) => i.vi && MOJI.test(i.vi));
if (moji.length) {
  bad(moji.length + " ban dich co dau hieu loi ma hoa (dong " + moji.slice(0, 3).map((i) => i.line).join(", ") + ")");
} else {
  ok("Khong co loi ma hoa trong ban dich");
}

// 4. Dau tieng Viet phai o dang chuan hoa NFC
const badNorm = items.filter((i) => i.vi && i.vi !== i.vi.normalize("NFC"));
if (badNorm.length) bad(badNorm.length + " ban dich chua chuan hoa NFC");
else ok("Moi ban dich da chuan hoa NFC");

console.log("\n=> " + (fail === 0 ? "TAT CA DAT" : fail + " loi"));
process.exit(fail ? 1 : 0);
