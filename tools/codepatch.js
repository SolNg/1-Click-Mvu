// Va cac doan KHONG phai chuoi (regex literal, nguong so, font stack, lang) — moi patch
// phai khop dung so lan khai bao, neu khong thi dung han.
const fs = require("fs");
const F = process.argv[2] || "src/index.vi.js";
let s = fs.readFileSync(F, "utf8");

const P = [
  // --- 1. Regex tach tien to YAML tom tat nhan vat (phai khop chuoi da dich o dong 3629) ---
  ["/^角色总览:\\s*/u", "/^Tóm tắt nhân vật:\\s*/u", 1],

  // --- 2. Blacklist chong-placeholder: viet lai pattern cho tieng Viet ---
  ["/待补充/u", "/chờ bổ sung|cần bổ sung|sẽ bổ sung|\\bTBD\\b|\\bTODO\\b/iu", 1],
  ["/用户手写/u", "/người dùng tự (viết|điền|nhập|bổ sung)/iu", 1],
  ["/当前任务/u", "/nhiệm vụ (hiện tại|này)|tác vụ hiện tại/iu", 1],
  ["/一键角色卡写卡器/u", "/trình tạo thẻ nhân vật một chạm/iu", 1],
  ["/模板|提示词|工程词|占位符|placeholder/iu",
   "/\\b(mẫu|template|prompt|placeholder)\\b|chỗ trống|nội dung tạm|điền sau/iu", 1],
  ["/前端会|工具会|生成器|代码会/u",
   "/(giao diện|công cụ|hệ thống|trình tạo|mã nguồn|code) (sẽ|tự động) /iu", 1],

  // --- 3. Phan loai loi: giu tu khoa cu, them tieng Viet ---
  ["/401|403|unauthorized|api.?key|quota|余额|额度/iu",
   "/401|403|unauthorized|api.?key|quota|余额|额度|số dư|hạn mức|hết lượt/iu", 1],
  ["/network|failed to fetch|timeout|timed out|网络|连接超时/iu",
   "/network|failed to fetch|timeout|timed out|网络|连接超时|mạng|hết thời gian chờ|quá thời gian/iu", 1],

  // --- 4. Do thong bao loi de dung avoidTerms (plan §6.3) ---
  //     Chap nhan ca ngoac toan giac lan ngoac thuong.
  ["/（([^）]+)）/gu", "/[（(]([^）)]+)[）)]/gu", 1],
  ["/工程词|占位内容|模板词|placeholder|内部标签/iu",
   "/từ công trình|nội dung tạm|từ mẫu|placeholder|thẻ nội bộ/iu", 1],
  ["/工程词|占位内容|模板词|工程占位词/u",
   "/từ công trình|nội dung tạm|từ mẫu|từ tạm công trình/iu", 1],

  // --- 5. Nguong chia doan: tinh theo chu Han -> tieng Viet dai gap ~3 lan (plan §6.1) ---
  ["function Xo(n, e = 2e4) {", "function Xo(n, e = 5e4) {", 1],
  ['for (; (t.length > 1 || t.join("\\n\\n").length > 2e4) && a < 8; ) {',
   'for (; (t.length > 1 || t.join("\\n\\n").length > 5e4) && a < 8; ) {', 1],
  ["const n = Wo(t, 2e4),", "const n = Wo(t, 5e4),", 1],

  // --- 6. Cat tom tat nhanh: 80 ky tu Han ~ 200 ky tu tieng Viet (plan §6.2) ---
  [").slice(0, 80);", ").slice(0, 200);", 1],
  ["(Ko(s) || e).slice(0, 80)", "(Ko(s) || e).slice(0, 200)", 1],

  // --- 7. Ngon ngu trang status bar ---
  ['<html lang="zh-CN">', '<html lang="vi">', 1],

  // --- 8. Font: uu tien font phu day du dau tieng Viet, giu font CJK o cuoi ---
  ["'Noto Sans SC','Source Han Sans SC','Microsoft YaHei UI',sans-serif",
   "'Be Vietnam Pro','Inter',-apple-system,'Segoe UI',Roboto,'Noto Sans SC',sans-serif", 1],
  ["'Noto Sans SC', 'Source Han Sans SC', 'Microsoft YaHei UI', sans-serif",
   "'Be Vietnam Pro', 'Inter', -apple-system, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif", 1],
  ["'Noto Serif SC','Source Han Serif SC','Songti SC',serif",
   "'Lora',Georgia,'Times New Roman','Noto Serif SC',serif", 14],
  ["'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif",
   "'Lora', Georgia, 'Times New Roman', 'Noto Serif SC', serif", 14],
  ["'Sarasa Mono SC','Microsoft YaHei UI',monospace",
   "'JetBrains Mono',ui-monospace,'Cascadia Code',Consolas,monospace", 2],
  ["'Sarasa Mono SC', 'Microsoft YaHei UI', monospace",
   "'JetBrains Mono', ui-monospace, 'Cascadia Code', Consolas, monospace", 2],
  ['font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;',
   'font-family: "Be Vietnam Pro", -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;', 1],

  // --- 9. Manh tieng Trung trong 4 blob JSON regex script (dong 5227/5232/5237/5242) ---
  ['"scriptName": "仅格式思维链"', '"scriptName": "Chi loc chuoi suy nghi"', 1],
  ['"scriptName": "只发送最新2楼的变量更新"', '"scriptName": "Chi gui cap nhat bien cua 2 luot moi nhat"', 1],
  ['"scriptName": "[美化]变量完成-三明月喵"', '"scriptName": "[Lam dep] Bien cap nhat xong"', 1],
  ['"scriptName": "[美化]变量更新中-三明月喵"', '"scriptName": "[Lam dep] Dang cap nhat bien"', 1],
  ["\\x3c!-- 圆形GIF头像 - 突出在左侧 --\\x3e", "\\x3c!-- Anh dai dien GIF tron - noi ra ben trai --\\x3e", 2],
  ["\\x3c!-- 横条 - 比头像矮，约2/3高度 --\\x3e", "\\x3c!-- Thanh ngang - thap hon anh dai dien, khoang 2/3 chieu cao --\\x3e", 2],
  ["\\x3c!-- 蓝色光晕流动效果 --\\x3e", "\\x3c!-- Hieu ung quang xanh chay ngang --\\x3e", 1],
  ["喵喵喵~ 变量完成了喵~", "Meo meo meo~ cap nhat bien xong roi~", 1],
  ["喵喵喵~ 正在变量中~", "Meo meo meo~ dang cap nhat bien~", 1],
  ["展开喵 ▶", "Mo ra meo ▶", 1],
  ["收起喵 ▼", "Thu lai meo ▼", 1],
  ['alt=\\\\"喵~\\\\"', 'alt=\\\\"meo~\\\\"', 2],
];

let n = 0;
for (const [find, repl, want] of P) {
  const got = s.split(find).length - 1;
  if (got !== want) {
    console.error(`LOI: patch khop ${got} lan (can ${want}): ${find.slice(0, 70)}`);
    process.exit(1);
  }
  s = s.split(find).join(repl);
  n++;
}
fs.writeFileSync(F, s);
console.log(`Da va ${n} patch code vao ${F}`);
