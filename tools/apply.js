// Ap ban dich vao source theo offset AST (thay tu cuoi ve dau de offset khong lech).
const fs = require("fs");
const SRC = process.argv[2] || "src/index.formatted.js";
const MAP = process.argv[3] || "i18n/strings.json";
const OUT = process.argv[4] || "src/index.vi.js";

const code = fs.readFileSync(SRC, "utf8");
const items = JSON.parse(fs.readFileSync(MAP, "utf8"));

function escTpl(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${").replace(/\r/g, "\\r");
}
const todo = items.filter((i) => i.vi !== null && i.vi !== undefined && i.vi !== i.zh);
todo.sort((a, b) => b.start - a.start);

let out = code;
let n = 0;
for (const it of todo) {
  const cur = code.slice(it.start, it.end);
  const replacement = it.kind === "str" ? JSON.stringify(it.vi) : escTpl(it.vi);
  // kiem tra offset con dung: chuoi goc phai xuat hien trong doan nay
  if (it.kind === "str") {
    const lit = cur.slice(1, -1);
    if (!lit.includes(it.zh.slice(0, 8).replace(/[\\`]/g, "")) && !cur.includes(it.zh.slice(0, 8))) {
      throw new Error(`Offset lech tai id=${it.id} dong ${it.line}: ${cur.slice(0, 60)}`);
    }
  }
  out = out.slice(0, it.start) + replacement + out.slice(it.end);
  n++;
}
fs.writeFileSync(OUT, out);
console.log("Da thay:", n, "/", items.length, "chuoi ->", OUT);
