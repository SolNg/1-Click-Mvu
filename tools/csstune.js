// Chen mot lop CSS bo sung cho tieng Viet vao cuoi writer-base.css (chuoi CSS that su duoc inject).
const fs = require("fs");
const F = process.argv[2] || "src/index.vi.js";
let s = fs.readFileSync(F, "utf8");

const ANCHOR = ".guide-box{display:grid}.asset-grid{grid-template-columns:1fr}}\\n";
if ((s.split(ANCHOR).length - 1) !== 1) { console.error("LOI: khong tim thay diem chen CSS"); process.exit(1); }

const VI_CSS = [
  "",
  "/* === Lop dieu chinh cho tieng Viet === */",
  // 1. Dau thanh + dau mu can chieu cao dong lon hon
  ".writer-shell,.writer-shell *{line-height:1.5}",
  ".writer-shell small,.writer-shell .panel-state,.writer-shell .workflow-tags i{line-height:1.45}",
  // 2. Chu qua nho lam dau thanh mo; nang san toi thieu
  ".writer-shell small,.writer-shell .context-label,.writer-shell .panel-index,",
  ".writer-shell .workflow-tags i,.writer-shell .optional-badge,.writer-shell .opening-step-badge{font-size:11px}",
  // 3. Nhan nhieu chu phai duoc xuong dong (tieng Viet dai gap ~3 lan tieng Trung)
  ".sidebar-nav-item small,.workflow-copy small,.workflow-copy strong,.pipeline-map small,",
  ".pipeline-map strong,.upload-copy strong,.upload-copy small,.toolbar-title p,",
  ".opening-project-summary strong,.compact-summary strong,.preflight-summary-grid strong,",
  ".completion-summary-grid strong,.context-pill strong{white-space:normal}",
  // 4. Tu dai (URL, ten the) khong duoc pha vo layout
  ".writer-shell{overflow-wrap:break-word}",
  // 5. Chieu cao co dinh -> toi thieu, de nhan 2 dong khong bi cat
  ".sidebar-nav-item,.workflow-card,.pipeline-map li,.connection-mode-switch button,",
  ".opening-preset-list button{height:auto;min-height:0}",
  // 6. Gian chu duong lam chu Latin roi rac
  ".writer-shell .panel-index,.writer-shell .optional-badge,.writer-shell .opening-step-badge{letter-spacing:.02em}",
].join("");

s = s.replace(ANCHOR, ANCHOR.slice(0, -2) + VI_CSS + "\\n");
fs.writeFileSync(F, s);
console.log("Da chen lop CSS tieng Viet (" + VI_CSS.length + " ky tu)");
