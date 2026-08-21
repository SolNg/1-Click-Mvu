// Gop cac file ban dich i18n/vi/*.json (id -> vi) vao i18n/strings.json
const fs = require("fs"), path = require("path");
const items = JSON.parse(fs.readFileSync("i18n/strings.json", "utf8"));
const byId = new Map(items.map((i) => [i.id, i]));
let n = 0, miss = [];
for (const f of fs.readdirSync("i18n/vi").filter((f) => f.endsWith(".json")).sort()) {
  const m = JSON.parse(fs.readFileSync(path.join("i18n/vi", f), "utf8"));
  for (const [id, vi] of Object.entries(m)) {
    const it = byId.get(id);
    if (!it) { miss.push(f + ":" + id); continue; }
    it.vi = vi; n++;
  }
}
fs.writeFileSync("i18n/strings.json", JSON.stringify(items, null, 1));
const total = items.length, done = items.filter((i) => i.vi).length;
console.log(`Gop ${n} ban dich | tien do ${done}/${total} (${(100 * done / total).toFixed(1)}%)`);
if (miss.length) { console.log("ID khong khop:", miss.slice(0, 10)); process.exit(1); }
