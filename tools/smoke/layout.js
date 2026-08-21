// Do dac layout that: tim phan tu bi cat chu hoac tran ra ngoai.
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");
require("./prepare")(process.argv[2] || "src/index.vi.js");

const ROOT = path.resolve(__dirname, "../..");
const MIME = { ".js": "text/javascript", ".html": "text/html", ".json": "application/json", ".css": "text/css" };
function serve(root) {
  return new Promise((res) => {
    const s = http.createServer((req, rep) => {
      const f = path.join(root, decodeURIComponent(req.url.split("?")[0]));
      fs.readFile(f, (e, d) => {
        if (e) return (rep.statusCode = 404), rep.end("not found");
        rep.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream");
        rep.end(d);
      });
    });
    s.listen(0, "127.0.0.1", () => res({ port: s.address().port, close: () => s.close() }));
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const srv = await serve(ROOT);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`http://127.0.0.1:${srv.port}/tools/smoke/harness.html`);
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const h = window.__handlers;
    h[Object.keys(h).find((k) => k.startsWith("button:"))]();
  });
  await page.waitForTimeout(2200);
  const inner = page.frames().find((f) => f !== page.mainFrame());

  const report = await inner.evaluate(() => {
    const out = { clipped: [], overflowY: [], tiny: [] };
    const els = document.querySelectorAll(".writer-shell *");
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || !el.offsetParent) continue;
      const txt = (el.textContent || "").trim();
      if (!txt) continue;
      const onlyText = el.children.length === 0;
      // Bi cat ngang: co chu, khong xuong dong duoc, noi dung rong hon khung
      if (onlyText && el.scrollWidth > el.clientWidth + 1) {
        out.clipped.push({
          sel: el.tagName.toLowerCase() + "." + (el.className || "").toString().split(" ").filter(Boolean).slice(0, 2).join("."),
          txt: txt.slice(0, 40),
          w: el.clientWidth,
          need: el.scrollWidth,
          ws: cs.whiteSpace,
          ov: cs.textOverflow,
        });
      }
      // Bi cat doc
      if (onlyText && el.scrollHeight > el.clientHeight + 2 && cs.overflowY === "hidden") {
        out.overflowY.push({
          sel: el.tagName.toLowerCase() + "." + (el.className || "").toString().split(" ").filter(Boolean).slice(0, 2).join("."),
          txt: txt.slice(0, 40),
          h: el.clientHeight,
          need: el.scrollHeight,
        });
      }
      if (onlyText && parseFloat(cs.fontSize) < 11) {
        out.tiny.push({ sel: el.tagName.toLowerCase() + "." + (el.className || "").toString().split(" ")[0], fs: cs.fontSize, txt: txt.slice(0, 25) });
      }
    }
    const dedupe = (arr, k) => {
      const m = new Map();
      for (const x of arr) if (!m.has(x[k])) m.set(x[k], x);
      return [...m.values()];
    };
    out.clipped = dedupe(out.clipped, "txt");
    out.overflowY = dedupe(out.overflowY, "txt");
    out.tiny = dedupe(out.tiny, "sel");
    out.bodyScrollX = document.body.scrollWidth > document.body.clientWidth;
    // Do do chong lan giua cac panel trong luoi setup
    const panels = [...document.querySelectorAll(".setup-dashboard-grid > section, .setup-dashboard-grid section.tool-panel")];
    let overlap = 0;
    for (let i = 0; i < panels.length; i++)
      for (let j = i + 1; j < panels.length; j++) {
        const a = panels[i].getBoundingClientRect(), b = panels[j].getBoundingClientRect();
        if (panels[i].contains(panels[j]) || panels[j].contains(panels[i])) continue;
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 2 && h > 2) overlap += Math.round(w * h);
      }
    out.overlapPx = overlap;
    return out;
  });

  console.log("=== Chu bi cat ngang (" + report.clipped.length + ") ===");
  report.clipped.forEach((c) =>
    console.log(`  ${c.sel}  [${c.w}px, can ${c.need}px]  white-space:${c.ws}  ${JSON.stringify(c.txt)}`),
  );
  console.log("\n=== Chu bi cat doc (" + report.overflowY.length + ") ===");
  report.overflowY.forEach((c) => console.log(`  ${c.sel}  [${c.h}px, can ${c.need}px]  ${JSON.stringify(c.txt)}`));
  console.log("\n=== Chu nho hon 11px (" + report.tiny.length + ") ===");
  report.tiny.slice(0, 12).forEach((c) => console.log(`  ${c.sel}  ${c.fs}  ${JSON.stringify(c.txt)}`));
  console.log("\nTran ngang toan trang:", report.bodyScrollX);
console.log("Dien tich panel chong lan:", report.overlapPx, "px2");

  await browser.close();
  srv.close();
  process.exit(report.clipped.length + report.overflowY.length > 0 ? 1 : 0);
})();
