// Chay thu that: nap bundle vao trinh duyet voi cac global cua SillyTavern duoc gia lap,
// bam nut mo trinh tao the, roi doc chu hien tren man hinh.
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

// ESM khong nap duoc qua file:// -> phuc vu ca repo qua HTTP
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

const ROOT = path.resolve(__dirname, "../..");
const TARGET = process.argv[2] || "src/index.vi.js";

require("./prepare")();

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const console_ = [];
  page.on("console", (m) => console_.push(m.type() + ": " + m.text()));
  page.on("pageerror", (e) => console_.push("pageerror: " + e.message));

  const srv = await serve(ROOT);
  await page.goto(`http://127.0.0.1:${srv.port}/tools/smoke/harness.html`);
  await page.waitForTimeout(1500);

  const buttons = await page.evaluate(() => window.__buttons);
  console.log("Nut script dang ky:", JSON.stringify(buttons));
  if (!buttons || !buttons.length) {
    console.log("--- console/loi truoc khi bam nut ---");
    console_.slice(0, 25).forEach((c) => console.log("  " + c.slice(0, 400)));
    console.log("--- __errors ---");
    (await page.evaluate(() => window.__errors)).slice(0, 10).forEach((c) => console.log("  " + c));
    await browser.close();
    srv.close();
    process.exit(1);
  }

  // Bam nut -> app tao iframe va mount vao do
  await page.evaluate(() => {
    const h = window.__handlers;
    const key = Object.keys(h).find((k) => k.startsWith("button:"));
    if (!key) throw new Error("khong tim thay handler cua nut");
    h[key]();
  });
  await page.waitForTimeout(2500);

  const frames = page.frames();
  const inner = frames.find((f) => f !== page.mainFrame());
  if (!inner) {
    console.log("LOI: app khong tao duoc iframe");
    console.log(console_.slice(0, 20).join("\n"));
    await browser.close();
    srv.close();
    process.exit(1);
  }

  const text = await inner.evaluate(() => document.body.innerText);
  const html = await inner.evaluate(() => document.body.innerHTML.length);
  const errors = await page.evaluate(() => window.__errors);

  fs.writeFileSync(path.join(__dirname, "screen-text.txt"), text);
  await page.screenshot({ path: path.join(__dirname, "screenshot.png"), fullPage: false });

  console.log("\n--- Kich thuoc DOM da render:", html, "ky tu HTML ---");
  console.log("--- Chu hien tren man hinh ---");
  console.log(text.slice(0, 1800));
  console.log("\n--- Loi trang (" + console_.filter((c) => /pageerror|error:/.test(c)).length + ") ---");
  console_.filter((c) => /pageerror|error:/.test(c)).slice(0, 15).forEach((c) => console.log("  " + c));
  console.log("\n--- window.__errors (" + errors.length + ") ---");
  errors.slice(0, 15).forEach((c) => console.log("  " + c));

  await browser.close();
  srv.close();
})();
