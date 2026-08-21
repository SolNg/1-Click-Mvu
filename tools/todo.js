// In cac chuoi chua dich trong khoang dong cho truoc, dang JSON de dien ban dich.
const fs = require("fs");
const items = JSON.parse(fs.readFileSync("i18n/strings.json", "utf8"));
const from = +(process.argv[2] || 0), to = +(process.argv[3] || 1e9), limit = +(process.argv[4] || 500);
const sel = items.filter((i) => i.vi == null && i.line >= from && i.line <= to).slice(0, limit);
sel.forEach((i) => console.log(`${i.id}\t${i.line}\t${i.ctx}\t${JSON.stringify(i.zh)}`));
console.log(`--- ${sel.length} chuoi (con lai trong khoang: ${items.filter((i) => i.vi == null && i.line >= from && i.line <= to).length}) ---`);
