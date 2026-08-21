// Kiem tra doc lap, sau hon verify.js: doi chieu tren CHINH file ket qua (khong tin bang dich).
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const A = fs.readFileSync("src/index.formatted.js", "utf8");
const B = fs.readFileSync("src/index.vi.js", "utf8");
const items = JSON.parse(fs.readFileSync("i18n/strings.json", "utf8"));
let fail = 0;
const ok = (m) => console.log("  OK   " + m);
const bad = (m) => {
  console.log("  LOI  " + m);
  fail++;
};
const section = (m) => console.log("\n" + m);

const CJK = /[一-鿿]/;
const astA = parser.parse(A, { sourceType: "module" });
const astB = parser.parse(B, { sourceType: "module" });

function collect(ast) {
  const tpl = [];
  const re = [];
  traverse(ast, {
    TemplateLiteral(p) {
      tpl.push({
        quasis: p.node.quasis.map((q) => q.value.cooked),
        exprs: p.node.expressions.length,
        line: p.node.loc.start.line,
      });
    },
    RegExpLiteral(p) {
      re.push({ pattern: p.node.pattern, flags: p.node.flags, line: p.node.loc.start.line });
    },
  });
  return { tpl, re };
}
const a = collect(astA);
const b = collect(astB);

function presetNode(src) {
  let node = null;
  traverse(parser.parse(src, { sourceType: "module" }), {
    StringLiteral(p) {
      if (p.node.value.startsWith('{\n  "max_context_unlocked"')) node = p.node;
    },
  });
  if (!node) throw new Error("khong tim thay chuoi preset");
  return node;
}
function presetOf(src) {
  return JSON.parse(presetNode(src).value);
}
// Cat han chuoi preset ra khoi nguon (dung offset AST, khong dung so khop van ban)
function withoutPreset(src) {
  const n = presetNode(src);
  return src.slice(0, n.start) + '"<<PRESET>>"' + src.slice(n.end);
}
const codeOnlyB = withoutPreset(B);

// ---------------------------------------------------------------- 1
section("1. Template literal: so bieu thuc ${} va so manh phai giu nguyen");
if (a.tpl.length !== b.tpl.length) {
  bad("So template literal khac: " + a.tpl.length + " vs " + b.tpl.length);
} else {
  let n = 0;
  for (let i = 0; i < a.tpl.length; i++) {
    if (a.tpl[i].exprs !== b.tpl[i].exprs || a.tpl[i].quasis.length !== b.tpl[i].quasis.length) {
      n++;
      if (n <= 5) bad("Template #" + i + " (dong " + b.tpl[i].line + ") doi so manh hoac so bieu thuc");
    }
  }
  if (!n) ok(a.tpl.length + " template literal giu nguyen so bieu thuc va so manh");
}

// ---------------------------------------------------------------- 2
section("2. Noi chuoi: tieng Trung khong can khoang trang quanh ${}, tieng Viet thi can");
{
  const LAT = /[A-Za-zÀ-ỹ]/;
  // Cac cho co y dinh lien: hau to tag, don vi thoi gian, don vi CSS
  const ALLOW = [/_id$/, /^p$|^s$/, /^px$/, /^p$/];
  let n = 0;
  for (const t of b.tpl) {
    for (let i = 0; i < t.quasis.length - 1; i++) {
      const before = t.quasis[i].slice(-1);
      const after = t.quasis[i + 1].slice(0, 1);
      const stuck = (after && LAT.test(after)) || (before && LAT.test(before));
      if (!stuck) continue;
      const okPair =
        ALLOW.some((r) => r.test(t.quasis[i])) || ALLOW.some((r) => r.test(t.quasis[i + 1].trim()));
      if (okPair) continue;
      n++;
      if (n <= 10) {
        bad(
          "Dinh chu o dong " + t.line + ": " +
            JSON.stringify(t.quasis[i].slice(-24)) + " ${} " + JSON.stringify(t.quasis[i + 1].slice(0, 24)),
        );
      }
    }
  }
  if (!n) ok("Khong cho nao bien noi thang vao chu (da tru hau to _id, don vi p/s, px)");
}

// ---------------------------------------------------------------- 3
section("3. Regex literal: compile duoc, giu co /u, chi duoc them co /i");
{
  let err = 0;
  for (const r of b.re) {
    try {
      new RegExp(r.pattern, r.flags);
    } catch (e) {
      err++;
      bad("Regex dong " + r.line + " khong compile: " + e.message);
    }
  }
  if (a.re.length !== b.re.length) {
    bad("So regex literal khac: " + a.re.length + " vs " + b.re.length);
  } else {
    let flagBad = 0;
    let added = 0;
    for (let i = 0; i < a.re.length; i++) {
      const fa = [...a.re[i].flags].sort().join("");
      const fb = [...b.re[i].flags].sort().join("");
      if (fa === fb) continue;
      const lost = [...fa].filter((c) => !fb.includes(c));
      const gained = [...fb].filter((c) => !fa.includes(c));
      if (lost.length || gained.some((c) => c !== "i")) {
        flagBad++;
        bad("Regex dong " + b.re[i].line + " doi co bat thuong: " + fa + " -> " + fb);
      } else added++;
    }
    if (!err && !flagBad) {
      ok(b.re.length + " regex compile duoc; " + added + " regex blacklist duoc them co /i (tieng Viet co hoa/thuong)");
    }
  }
}

// ---------------------------------------------------------------- 4
section("4. Sentinel: chuoi vua hien thi vua dung de so sanh");
{
  const countIn = (src, s) => src.split(s).length - 1;
  const codeOnly = codeOnlyB;
  const SENT = [
    { zh: "未打开角色卡", vi: "Chưa mở thẻ nhân vật", n: 4, note: "gan / so sanh !== x2 / tinh %" },
    { zh: "新角色 ", vi: "Nhân vật mới ", n: 2, note: "Set.has + template sinh ten" },
    { zh: "世界书", vi: " - World book", n: 2, note: "hau to ten world book" },
  ];
  for (const s of SENT) {
    const left = countIn(codeOnly, s.zh);
    const cv = countIn(B, s.vi);
    if (left > 0) bad(`Sentinel "${s.zh}" van con ${left} lan trong phan code`);
    else if (cv < s.n) bad(`Sentinel "${s.vi}" chi co ${cv} lan, mong doi >= ${s.n}`);
    else ok(`"${s.zh}" -> "${s.vi}" x${cv} — ${s.note}`);
  }
}

// ---------------------------------------------------------------- 5
section("5. Bien MVU va gia tri mac dinh");
{
  const codeOnly = codeOnlyB;
  const countIn = (s) => codeOnly.split(s).length - 1;
  for (const v of ["the_gioi", "thoi_gian", "dia_diem", "thien_cam"]) {
    if (countIn(v) < 2) bad(`Bien "${v}" chi xuat hien ${countIn(v)} lan trong code`);
  }
  for (const v of ["好感度", "当前时间", "当前地点", "世界:"]) {
    if (countIn(v) > 0) bad(`Ten bien cu "${v}" van con ${countIn(v)} lan trong code`);
  }
  const paths = ["stat_data.the_gioi.thoi_gian", "stat_data.the_gioi.dia_diem", ".thien_cam"];
  const miss = paths.filter((p) => !codeOnly.includes(p));
  if (miss.length) bad("Thieu duong dan bien: " + miss.join(", "));
  const mo = countIn("Mở đầu");
  const chua = countIn("Chưa rõ");
  if (mo < 3) bad(`"Mở đầu" chi co ${mo} lan (can >= 3: prefault, YAML init, fallback status bar)`);
  if (chua < 3) bad(`"Chưa rõ" chi co ${chua} lan (can >= 3)`);
  if (!miss.length && mo >= 3 && chua >= 3) {
    ok(`4 ten bien + 3 duong dan nhat quan; mac dinh "Mở đầu" x${mo}, "Chưa rõ" x${chua}; khong con ten cu`);
  }
}

// ---------------------------------------------------------------- 6
section("6. Tien to, tag giao thuc va tag XML long trong muc world book");
{
  const need = [
    "[initvar]",
    "[mvu_update]",
    "{{format_message_variable::stat_data}}",
    "<StatusPlaceHolderImpl",
    "<UpdateVariable>",
    "<JSONPatch>",
    "registerMvuSchema",
  ];
  const miss = need.filter((s) => !B.includes(s));
  if (miss.length) bad("Mat tien to / tag: " + miss.join(", "));
  else ok("Con du " + need.length + " tien to va tag giao thuc");
  const tags = [
    "the_gioi_quan_id1",
    "tom_tat_nhan_vat_id0",
    "thong_tin_co_ban",
    "bang_mau_tinh_cach",
    "dien_giai_bo_sung",
    "ho_so_nhieu_giai_doan_ejs",
  ];
  const badTag = tags.filter((t) => !B.includes(t) || !/^[a-z0-9_]+$/.test(t));
  if (badTag.length) bad("Tag XML thieu hoac co dau/khoang trang: " + badTag.join(", "));
  else ok(tags.length + " tag XML long trong muc deu khong dau, khong khoang trang");
}

// ---------------------------------------------------------------- 7
section("7. Rac ky thuat va khoang trang thua trong ban dich");
{
  const done = items.filter((i) => i.vi != null && i.vi !== i.zh);
  const junk = done.filter((i) => /\bundefined\b|\bNaN\b|\[object Object\]/.test(i.vi));
  if (junk.length) bad(junk.length + " ban dich chua undefined / NaN / [object Object]");
  else ok("Khong ban dich nao chua rac ky thuat");
  const dbl = done.filter((i) => /\S  +\S/.test(i.vi) && !i.vi.includes("\n"));
  if (dbl.length) bad(dbl.length + " ban dich co khoang trang doi giua cau (dong " + dbl.slice(0, 5).map((i) => i.line).join(", ") + ")");
  else ok("Khong co khoang trang doi giua cau");
  const empties = done.filter((i) => i.vi === "");
  ok(empties.length + " ban dich co y de rong (manh noi cau): dong " + empties.map((i) => i.line).join(", "));
}

// ---------------------------------------------------------------- 8
section("8. Dau cau toan giac: chi duoc con trong chuoi prompt, khong duoc con trong giao dien");
{
  const done = items.filter((i) => i.vi != null && i.vi !== i.zh);
  const FULL = /[，。：；！？（）“”、]/; // 【】 giu lam dau phan doan trong prompt
  const leftover = done.filter((i) => FULL.test(i.vi));
  if (leftover.length) {
    bad(leftover.length + " ban dich con dau cau toan giac (ngoai 【】):");
    leftover.slice(0, 8).forEach((i) => console.log("         dong " + i.line + ": " + JSON.stringify(i.vi).slice(0, 70)));
  } else ok("Khong con dau cau toan giac (【】 giu co y lam dau phan doan trong prompt)");
  const brackets = done.filter((i) => /[【】]/.test(i.vi));
  const uiBrackets = brackets.filter((i) => i.line < 3584 || i.ctx.startsWith("CALL:r.create"));
  if (uiBrackets.length) bad(uiBrackets.length + " chuoi GIAO DIEN con 【】 (dong " + uiBrackets.map((i) => i.line).join(", ") + ")");
  else ok(brackets.length + " chuoi con 【】 deu la chuoi prompt gui cho LLM, khong phai giao dien");
}

// ---------------------------------------------------------------- 9
section("9. Blob JSON trong chuoi va cac blob regex script");
{
  let n = 0;
  let e = 0;
  traverse(astB, {
    StringLiteral(p) {
      const v = p.node.value.trim();
      if (!v.startsWith("{") || v.length < 100) return;
      if (v.startsWith('{\n  "max_context_unlocked"')) return; // preset, kiem tra rieng o muc 10
      n++;
      try {
        const o = JSON.parse(v);
        if (v.includes('"scriptName"') && !o.id) {
          e++;
          bad("Blob regex script dong " + p.node.loc.start.line + " mat truong id");
        }
      } catch (err) {
        e++;
        bad("Blob JSON dong " + p.node.loc.start.line + " khong parse duoc: " + err.message);
      }
    },
  });
  if (!e) ok(n + " blob JSON trong chuoi deu parse duoc, con nguyen truong id");
}

// ---------------------------------------------------------------- 10
section("10. Preset: cau truc va tham so phai y het ban goc");
{
  const pa = presetOf(A);
  const pb = presetOf(B);
  const cmp = [
    ["identifier", (p) => p.prompts.map((x) => String(x.identifier)).join("|")],
    ["enabled", (p) => p.prompts.map((x) => String(x.enabled)).join("|")],
    ["role", (p) => p.prompts.map((x) => x.role || "").join("|")],
    ["prompt_order", (p) => JSON.stringify(p.prompt_order)],
    ["regex id", (p) => p.extensions.regex_scripts.map((x) => x.id).join("|")],
    ["regex findRegex", (p) => p.extensions.regex_scripts.map((x) => x.findRegex).join("|")],
    ["script id", (p) => p.extensions.tavern_helper.scripts.map((x) => x.id).join("|")],
    ["script content", (p) => p.extensions.tavern_helper.scripts.map((x) => x.content).join("|")],
    ["button name", (p) => JSON.stringify(p.extensions.tavern_helper.scripts.map((x) => x.button?.buttons ?? []))],
  ];
  let d = 0;
  for (const [name, f] of cmp) {
    if (f(pa) !== f(pb)) {
      d++;
      bad("Preset: " + name + " bi doi");
    }
  }
  const nums = Object.keys(pa).filter((k) => typeof pa[k] === "number" || typeof pa[k] === "boolean");
  const diff = nums.filter((k) => pa[k] !== pb[k]);
  if (diff.length) {
    d++;
    bad("Tham so preset bi doi: " + diff.join(", "));
  }
  if (!d) ok(cmp.length + " nhom cau truc + " + nums.length + " tham so cua preset giu nguyen y het");
}

// ---------------------------------------------------------------- 11
section("11. Prompt thuc su den tay LLM khong con chu Han");
{
  const pb = presetOf(B);
  const Or = new Set(Array.from({ length: 29 }, (_, n) => String(n + 12)));
  const map = new Map(pb.prompts.map((p) => [String(p.identifier), p]));
  const sent = [];
  for (const r of pb.prompt_order[0].order) {
    const id = String(r.identifier);
    if (Or.has(id)) continue;
    const p = map.get(id);
    if (!r.enabled || !p || p.enabled === false || !p.content) continue;
    sent.push(id);
  }
  const check = [...new Set([...sent, "13", "39", "24"])];
  const dirty = check.filter((id) => CJK.test(map.get(id).content || ""));
  if (dirty.length) bad("Prompt duoc gui van con chu Han: id " + dirty.join(", "));
  else ok(check.length + " prompt den tay LLM (" + sent.length + " gui moi luot + 3 knowledge) khong con chu Han");
}

// ---------------------------------------------------------------- 12
section("12. Chu Han con lai trong preset phai dung la tap da khai bao");
{
  const pb = presetOf(B);
  const hits = [];
  (function walk(o, path) {
    if (typeof o === "string") {
      const m = o.match(/[一-鿿]/g);
      if (m) hits.push({ path, n: m.length });
      return;
    }
    if (Array.isArray(o)) return o.forEach((v, i) => walk(v, path + "[" + i + "]"));
    if (o && typeof o === "object") return Object.entries(o).forEach(([k, v]) => walk(v, path + "." + k));
  })(pb, "preset");
  const ALLOW = {
    "preset.prompts[28].content": "prompt id 20 — khong dich (xem docs/i18n-status.md)",
    "preset.prompts[43].content": "doan duong dan tieng Trung trong URL CDN",
    "preset.extensions.tavern_helper.scripts[0].content": "ma JS da minify tu CDN",
    "preset.extensions.tavern_helper.scripts[1].content": "URL CDN co duong dan tieng Trung",
    "preset.extensions.tavern_helper.scripts[1].button.buttons[0].name": "script CDN khop handler theo ten nut",
    "preset.extensions.tavern_helper.scripts[1].button.buttons[1].name": "script CDN khop handler theo ten nut",
    "preset.extensions.tavern_helper.scripts[1].data.depth_injection.above.placeholder": "ten macro do script dang ky",
    "preset.extensions.tavern_helper.scripts[1].data.depth_injection.below.placeholder": "ten macro do script dang ky",
  };
  const unexpected = hits.filter((h) => !ALLOW[h.path]);
  if (unexpected.length) {
    bad("Chu Han o vi tri ngoai du kien trong preset:");
    unexpected.forEach((h) => console.log("         " + h.path + " (" + h.n + " ky tu)"));
  } else {
    ok(hits.length + " vi tri con chu Han trong preset, tat ca deu co ly do:");
    hits.forEach((h) => console.log("         " + h.path + " (" + h.n + ") — " + ALLOW[h.path]));
  }
}

// ---------------------------------------------------------------- 13
section("13. Chu Han con lai ngoai preset");
{
  const lines = codeOnlyB.split("\n");
  const found = [];
  lines.forEach((l, i) => {
    const m = l.match(/[\u4e00-\u9fff]/g);
    if (m) found.push({ line: i + 1, n: m.length, txt: l, sample: (l.match(/[\u4e00-\u9fff][^"',]{0,26}/) || [""])[0] });
  });
  const ALLOW = [
    { re: /webpack:\/\//, why: "duong dan sourcemap cua file goc" },
    { re: /\u4f59\u989d|\u989d\u5ea6|\u7f51\u7edc|\u8fde\u63a5\u8d85\u65f6/, why: "tu khoa loi tieng Trung tu SillyTavern trong regex phan loai" },
    { re: /\u91cd\u65b0\u5904\u7406\u53d8\u91cf|\u5feb\u7167\u697c\u5c42|\u91cd\u6f14\u697c\u5c42|\u6e05\u9664\u65e7\u697c\u5c42\u53d8\u91cf/, why: "ten nut cua MVU, MVU khop handler theo ten" },
  ];
  const unexpected = found.filter((f) => !ALLOW.some((x) => x.re.test(f.txt)));
  if (unexpected.length) {
    bad("Chu Han ngoai du kien o dong: " + unexpected.map((f) => f.line + " (" + f.sample.slice(0, 24) + ")").join(", "));
  } else {
    ok(found.length + " dong con chu Han ngoai preset, tat ca deu co ly do:");
    found.forEach((f) => {
      const why = ALLOW.find((x) => x.re.test(f.txt));
      console.log("         dong " + f.line + " (" + f.n + ") — " + why.why);
    });
  }
}

console.log("\n=> " + (fail === 0 ? "AUDIT: TAT CA DAT" : "AUDIT: " + fail + " loi"));
process.exit(fail ? 1 : 0);
