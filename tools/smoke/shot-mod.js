// Chup man hinh "Mod the co san" de xem bang mat: tools/smoke/mod-pc.png, mod-mobile.png
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");
require("./prepare")(process.argv[2] || "src/index.mod.js");

const ROOT = path.resolve(__dirname, "../..");
const MIME = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css" };
const srv = http.createServer((rq, rp) => {
  const f = path.join(ROOT, decodeURIComponent(rq.url.split("?")[0]));
  fs.readFile(f, (e, d) => {
    if (e) return (rp.statusCode = 404), rp.end("x");
    rp.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream");
    rp.end(d);
  });
});
srv.listen(0, "127.0.0.1", async () => {
  const port = srv.address().port;
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  for (const [w, h, name] of [
    [1280, 900, "mod-pc"],
    [390, 844, "mod-mobile"],
  ]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 700, hasTouch: w < 700 });
    await p.goto(`http://127.0.0.1:${port}/tools/smoke/harness.html`);
    await p.waitForTimeout(1000);
    await p.evaluate(() => {
      const H = window.__handlers;
      H[Object.keys(H).find((k) => k.startsWith("button:"))]();
    });
    await p.waitForTimeout(1800);
    const f = p.frames().find((x) => x !== p.mainFrame());
    await f.evaluate(() => document.querySelector(".workflow-option.mod-workflow").click());
    await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(__dirname, name + ".png") });
    await p.close();
    console.log("tools/smoke/" + name + ".png");
  }
  await b.close();
  srv.close();
});
