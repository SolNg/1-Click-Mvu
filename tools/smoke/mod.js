// Chay thu man hinh "Mod the co san" trong trinh duyet that: mo app, bam nut quy trinh
// thu 4, do dac DOM, bam nut cai dat va kiem tra cac API cua SillyTavern duoc goi dung.
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");
const target = process.argv[2] || "src/index.mod.js";
require("./prepare")(target);

const ROOT = path.resolve(__dirname, "../..");
const MIME = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".json": "application/json" };
function serve(root) {
  return new Promise((res) => {
    const s = http.createServer((rq, rp) => {
      const f = path.join(root, decodeURIComponent(rq.url.split("?")[0]));
      fs.readFile(f, (e, d) => {
        if (e) return (rp.statusCode = 404), rp.end("x");
        rp.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream");
        rp.end(d);
      });
    });
    s.listen(0, "127.0.0.1", () => res({ port: s.address().port, close: () => s.close() }));
  });
}

const SIZES = [
  [1600, 1000],
  [1280, 900],
  [900, 820],
  [390, 844],
];

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const srv = await serve(ROOT);
  let fail = 0;
  const ok = (m) => console.log("  OK   " + m);
  const bad = (m) => (console.log("  LOI  " + m), fail++);

  // ---------- 1. Chuc nang ----------
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  page.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text()));
  await page.goto(`http://127.0.0.1:${srv.port}/tools/smoke/harness.html`);
  await page.waitForTimeout(1200);

  const buttons = await page.evaluate(() => window.__buttons);
  if (buttons && buttons.length === 1 && /\(mod\)$/.test(buttons[0].name))
    ok("nut script rieng cua ban mod: " + buttons[0].name);
  else bad("nut script sai: " + JSON.stringify(buttons));

  await page.evaluate(() => {
    const h = window.__handlers;
    h[Object.keys(h).find((k) => k.startsWith("button:"))]();
  });
  await page.waitForTimeout(2000);
  const inner = page.frames().find((f) => f !== page.mainFrame());
  if (!inner) {
    bad("app khong tao duoc iframe");
    console.log(errs.join("\n"));
    await browser.close();
    srv.close();
    process.exit(1);
  }

  const hasModBtn = await inner.evaluate(() => {
    const b = [...document.querySelectorAll(".workflow-option")];
    return { count: b.length, mod: b.filter((x) => x.classList.contains("mod-workflow")).length, text: b.map((x) => x.innerText.split("\n")[0]) };
  });
  if (hasModBtn.count === 4 && hasModBtn.mod === 1) ok("man hinh dau co 4 quy trinh, 1 la Mod: " + hasModBtn.text.join(" | "));
  else bad("so nut quy trinh sai: " + JSON.stringify(hasModBtn));

  await inner.evaluate(() => document.querySelector(".workflow-option.mod-workflow").click());
  await page.waitForTimeout(1200);

  const view = await inner.evaluate(() => {
    const v = document.querySelector(".mod-view");
    if (!v) return null;
    return {
      panels: v.querySelectorAll(".tool-panel").length,
      heading: v.querySelector("h2")?.textContent,
      kicker: document.querySelector(".writer-header .view-kicker, .toolbar-title")?.innerText?.slice(0, 40) ?? "",
      roleInputs: v.querySelectorAll('input[type="text"]').length,
      checks: v.querySelectorAll('input[type="checkbox"]').length,
      runDisabled: v.querySelector("button.primary")?.disabled,
      runText: v.querySelector("button.primary")?.textContent,
      logs: [...v.querySelectorAll(".log-list li")].map((x) => x.textContent),
      text: v.innerText.replace(/\n{2,}/g, "\n").slice(0, 900),
    };
  });
  const detected = await inner.evaluate(() => ({
    names: [...document.querySelectorAll('.mod-view input[type="text"]')]
      .filter((x) => /Tên nhân vật/u.test(x.placeholder || ""))
      .map((x) => x.value),
    chips: [...document.querySelectorAll(".mod-view .suggestion-chip")].map((x) => x.textContent),
  }));
  console.log("\n--- Sau khi do lan dau ---");
  console.log("  o ten nhan vat: " + JSON.stringify(detected.names));
  console.log("  goi y: " + detected.chips.join(" | "));
  detected.names.every((x) => !x.trim())
    ? ok("khong tu dien ten the vao o nhan vat")
    : bad("da tu dien ten the: " + JSON.stringify(detected.names));
  ["Hitori Gotoh", "Bocchi", "Nijika Ijichi", "Nijika", "Ghi chép riêng của tôi"].every((x) => detected.chips.includes(x))
    ? ok("goi y lay du ten muc va tu khoa kich hoat trong world book")
    : bad("goi y thieu ten tu world book: " + detected.chips.join(", "));
  detected.chips[detected.chips.length - 1] === "Thu Minh Nguyet"
    ? ok("ten the xep cuoi danh sach goi y")
    : bad("ten the khong nam cuoi goi y: " + detected.chips.join(", "));

  if (!view) {
    bad("khong render duoc man hinh mod");
  } else {
    view.panels === 4 ? ok("4 panel: " + view.heading) : bad("so panel sai: " + view.panels);
    view.checks >= 6 ? ok(view.checks + " o chon phan cai dat") : bad("thieu o chon: " + view.checks);
    view.logs.length ? ok("nhat ky do tim: " + view.logs.join(" / ")) : bad("khong co nhat ky do tim");
    console.log("\n--- Chu tren man hinh mod ---\n" + view.text + "\n---");
  }

  // Dien ten nhan vat roi bam cai dat
  const result = await page.evaluate(async () => {
    window.__calls = [];
    const wrap = (name, fn) => {
      const orig = window[name];
      window[name] = async (...a) => {
        window.__calls.push({ name, args: a.map((x) => (typeof x === "function" ? "fn" : x)) });
        return orig ? await orig(...a) : undefined;
      };
    };
    ["createWorldbook", "updateWorldbookWith", "createWorldbookEntries", "updateCharacterWith", "updateTavernRegexesWith", "updateScriptTreesWith", "rebindCharWorldbooks"].forEach((n) => wrap(n));
    return true;
  });
  void result;

  // Bam vao goi y "Hitori Gotoh" thay vi go tay
  await inner.evaluate(() => {
    [...document.querySelectorAll(".mod-view .suggestion-chip")].find((x) => x.textContent === "Hitori Gotoh").click();
  });
  await page.waitForTimeout(400);
  const picked = await inner.evaluate(() =>
    [...document.querySelectorAll('.mod-view input[type="text"]')]
      .filter((x) => /Tên nhân vật/u.test(x.placeholder || ""))
      .map((x) => x.value),
  );
  picked.length === 1 && picked[0] === "Hitori Gotoh"
    ? ok("bam goi y thi dien vao o nhan vat")
    : bad("bam goi y khong dien dung: " + JSON.stringify(picked));
  await inner.evaluate(() => document.querySelector(".mod-view button.primary").click());
  await page.waitForTimeout(2500);

  const after = await inner.evaluate(() => ({
    logs: [...document.querySelectorAll(".mod-view .log-list li")].map((x) => x.textContent),
    runText: document.querySelector(".mod-view button.primary")?.textContent,
  }));
  const calls = await page.evaluate(() => window.__calls.map((c) => c.name));
  console.log("\n--- Nhat ky sau khi bam cai dat ---");
  after.logs.forEach((l) => console.log("  " + l));
  console.log("--- API cua SillyTavern duoc goi ---\n  " + calls.join(", "));

  const need = ["updateWorldbookWith", "createWorldbookEntries", "updateCharacterWith"];
  const lack = need.filter((n) => !calls.includes(n));
  lack.length === 0 ? ok("da goi du cac API ghi the") : bad("thieu API: " + lack.join(", "));
  after.logs.some((l) => /Hoàn tất/u.test(l)) ? ok("chay het quy trinh mod") : bad("khong bao hoan tat");
  after.logs.some((l) => /StatusPlaceHolderImpl\/> vào 1 lời mở đầu/u.test(l))
    ? ok("chi gan thanh trang thai vao loi mo dau chinh, khong dong loi chao thay the")
    : bad("khong gan dung so luong loi mo dau");
  const greet = await page.evaluate(() => window.SillyTavern.characters[0].first_messages);
  /<StatusPlaceHolderImpl\/>$/u.test(greet[0]) && !/StatusPlaceHolderImpl/u.test(greet[1])
    ? ok("noi dung loi mo dau cu duoc giu nguyen, chi noi them the")
    : bad("loi mo dau bi sua sai: " + JSON.stringify(greet));
  /Trăng lên tới đỉnh đồi/u.test(greet[0]) ? ok("chu nguoi dung viet khong bi mat") : bad("mat chu goc trong loi mo dau");
  after.logs.some((l) => /^Lỗi|thất bại|không/iu.test(l)) && console.log("  (co canh bao trong nhat ky — xem o tren)");

  // --- An toan: noi dung nguoi dung tu lam phai con nguyen ---
  const state = await page.evaluate(() => ({
    book: (window.__books["Sách thế giới của Thu Minh Nguyệt"] || []).map((x) => ({ name: x.name, src: x.extra && x.extra.source })),
    books: Object.keys(window.__books),
    regex: (window.SillyTavern.characters[0].extensions.regex_scripts || []).map((x) => x.script_name),
    scripts: (window.SillyTavern.characters[0].extensions.tavern_helper.scripts || []).map((x) => x.name),
  }));
  console.log("\n--- Trang thai the sau khi mod ---");
  console.log("  sach the gioi: " + state.books.join(" | "));
  state.book.forEach((e) => console.log(`    muc: ${e.name}${e.src ? "   [do cong cu tao]" : "   [cua nguoi dung]"}`));
  console.log("  regex: " + state.regex.join(" | "));
  console.log("  script: " + state.scripts.join(" | "));

  state.books.length === 1
    ? ok("khong tao them sach the gioi moi — ghi vao dung sach da co")
    : bad("da tao them sach the gioi: " + state.books.join(", "));
  state.book.some((e) => e.name === "Ghi chép riêng của tôi" && !e.src)
    ? ok("muc nguoi dung tu viet trong sach the gioi con nguyen")
    : bad("mat muc nguoi dung tu viet trong sach the gioi");
  const mvuNames = state.book.filter((e) => e.src).map((e) => e.name);
  mvuNames.length === 5 ? ok("da them 5 muc MVU: " + mvuNames.join(", ")) : bad("so muc MVU sai: " + mvuNames.length);
  mvuNames.some((n) => /^\[initvar\]/u.test(n)) && mvuNames.some((n) => /^\[mvu_update\]/u.test(n))
    ? ok("co du tien to [initvar] va [mvu_update]")
    : bad("thieu tien to bat buoc cua MVU");
  state.regex.includes("Regex riêng của tôi")
    ? ok("regex rieng cua nguoi dung con nguyen")
    : bad("mat regex rieng cua nguoi dung");
  state.regex.length === 7 ? ok("tong 7 regex (1 cua nguoi dung + 6 cua cong cu)") : bad("so regex sai: " + state.regex.length);
  state.scripts.includes("Script riêng của tôi")
    ? ok("script rieng cua nguoi dung con nguyen")
    : bad("mat script rieng cua nguoi dung");
  state.scripts.includes("MVU") && state.scripts.some((n) => /Cấu trúc biến/u.test(n))
    ? ok("da cai script MVU va Cau truc bien")
    : bad("thieu script MVU / Cau truc bien: " + state.scripts.join(", "));

  // --- Chay lan hai: khong duoc nhan doi ---
  await inner.evaluate(() => document.querySelector(".mod-view button.primary").click());
  await page.waitForTimeout(2500);
  const twice = await page.evaluate(() => ({
    book: (window.__books["Sách thế giới của Thu Minh Nguyệt"] || []).length,
    regex: window.SillyTavern.characters[0].extensions.regex_scripts.length,
    scripts: window.SillyTavern.characters[0].extensions.tavern_helper.scripts.length,
    greet: window.SillyTavern.characters[0].first_messages[0],
  }));
  twice.book === state.book.length && twice.regex === 7 && twice.scripts === 3
    ? ok("chay lan hai khong nhan doi noi dung")
    : bad("chay lan hai bi nhan doi: " + JSON.stringify(twice));
  (twice.greet.match(/<StatusPlaceHolderImpl\/>/gu) || []).length === 1
    ? ok("the thanh trang thai khong bi them lan hai")
    : bad("the thanh trang thai bi nhan doi");

  // --- Do lai tu the da co MVU: phai nhan ra ten nhan vat trong [initvar] ---
  await inner.evaluate(() => {
    const b = [...document.querySelectorAll(".mod-view button")].find((x) => /Dò từ thẻ/u.test(x.textContent));
    b.click();
  });
  await page.waitForTimeout(1200);
  const redetect = await inner.evaluate(() => ({
    logs: [...document.querySelectorAll(".mod-view .log-list li")].map((x) => x.textContent),
    names: [...document.querySelectorAll('.mod-view input[type="text"]')]
      .filter((x) => /Tên nhân vật/u.test(x.placeholder || ""))
      .map((x) => x.value),
  }));
  redetect.names.length === 1 && redetect.names[0] === "Hitori Gotoh"
    ? ok("do lai tu [initvar] co san ra dung ten nhan vat")
    : bad("do lai sai: " + JSON.stringify(redetect.names) + " / " + redetect.logs.slice(-2).join(" | "));

  const pageErrs = errs.filter((e) => !/favicon|404/.test(e));
  pageErrs.length === 0 ? ok("khong co loi JS") : pageErrs.slice(0, 6).forEach((e) => bad(e));

  await page.close();

  // ---------- 2. Bo cuc ----------
  console.log("\n--- Bo cuc man hinh mod ---");
  console.log("khung nhin    cat_chu  tran_ngang");
  for (const [W, H] of SIZES) {
    const p = await browser.newPage({ viewport: { width: W, height: H }, isMobile: W < 700, hasTouch: W < 700 });
    await p.goto(`http://127.0.0.1:${srv.port}/tools/smoke/harness.html`);
    await p.waitForTimeout(900);
    await p.evaluate(() => {
      const h = window.__handlers;
      h[Object.keys(h).find((k) => k.startsWith("button:"))]();
    });
    await p.waitForTimeout(1600);
    const f = p.frames().find((x) => x !== p.mainFrame());
    await f.evaluate(() => document.querySelector(".workflow-option.mod-workflow").click());
    await p.waitForTimeout(900);
    const m = await f.evaluate(() => {
      const v = document.querySelector(".mod-view");
      const clip = [...v.querySelectorAll("*")].filter(
        (e) => e.children.length === 0 && (e.textContent || "").trim() && e.scrollWidth > e.clientWidth + 1,
      );
      const docW = document.documentElement.clientWidth;
      const wide = [...v.querySelectorAll("*")].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > docW + 2 || r.left < -2);
      });
      return {
        clip: clip.map((e) => (e.textContent || "").trim().slice(0, 30)),
        wide: wide.map((e) => e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ")[0]),
      };
    });
    const line = `${String(W + "x" + H).padEnd(12)}  ${String(m.clip.length).padEnd(7)}  ${m.wide.length}`;
    console.log(line + (m.clip.length ? "   " + JSON.stringify(m.clip.slice(0, 3)) : "") + (m.wide.length ? "   " + m.wide.slice(0, 3).join(",") : ""));
    if (m.clip.length + m.wide.length > 0) fail++;
    await p.close();
  }

  await browser.close();
  srv.close();
  console.log(fail === 0 ? "\nTAT CA DEU DAT" : `\nCO ${fail} LOI`);
  process.exit(fail === 0 ? 0 : 1);
})();
