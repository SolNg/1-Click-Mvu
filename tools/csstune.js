// Chen lop CSS bo sung cho tieng Viet vao cuoi writer-base.css.
//
// Do do uu tien: moi selector deu duoc them tien to .writer-shell de co do uu tien cao hon
// rule goc mot bac (0,2,1 so voi 0,1,1). Lam vay thi khong phu thuoc vao viec stylesheet nao
// duoc inject sau — do dac trong trinh duyet cho thay writer-base duoc chen sau tamamo-app,
// nguoc voi thu tu require trong bundle.
const fs = require("fs");
const F = process.argv[2] || "src/index.vi.js";
let s = fs.readFileSync(F, "utf8");

const ANCHOR = ".guide-box{display:grid}.asset-grid{grid-template-columns:1fr}}\\n";
if (s.split(ANCHOR).length - 1 !== 1) {
  console.error("LOI: khong tim thay diem chen CSS");
  process.exit(1);
}

// Cac nhan nhieu chu phai duoc xuong dong (tieng Viet dai gap ~3 lan tieng Trung)
const WRAP = [
  ".sidebar-nav-item strong",
  ".sidebar-nav-item small",
  ".workflow-copy strong",
  ".workflow-copy small",
  ".pipeline-map strong",
  ".pipeline-map small",
  ".upload-copy strong",
  ".upload-copy small",
  ".toolbar-title p",
  ".opening-project-summary strong",
  ".compact-summary strong",
  ".preflight-summary-grid strong",
  ".completion-summary-grid strong",
  ".context-pill strong",
  ".empty-character-callout button",
  ".connection-mode-head>span",
];
// Nhan nho co dau tieng Viet: nang san co chu
const BUMP = [
  ".panel-state",
  ".upload-action",
  ".app-statusbar span",
  ".context-label",
  ".workflow-tags i",
  ".optional-badge",
  ".opening-step-badge",
  ".sidebar-brand-copy small",
  ".sidebar-nav-item small",
  ".workflow-copy small",
  ".pipeline-map small",
  ".app-statusbar",
  ".upload-copy small",
  ".connection-mode-card>p",
  ".connection-mode-head small",
];
// Chieu cao co dinh -> toi thieu, de nhan 2 dong khong bi cat
const AUTOH = [
  ".sidebar-nav-item",
  ".workflow-card",
  ".pipeline-map li",
  ".connection-mode-switch button",
  ".opening-preset-list button",
];

const pre = (list) => list.map((x) => ".writer-shell " + x).join(",");

const VI_CSS = [
  "",
  "/* === Lop dieu chinh cho tieng Viet === */",
  // 1. Dau thanh + dau mu can chieu cao dong lon hon
  ".writer-shell,.writer-shell *{line-height:1.5}",
  // 2. Nhan nhieu chu phai xuong dong, khong cat bang dau ba cham
  pre(WRAP) + "{white-space:normal;text-overflow:clip;overflow:visible}",
  // 3. Nang san co chu cho cac nhan co dau
  pre(BUMP) + "{font-size:11px}",
  // 4. Tu dai (URL, ten the) khong duoc pha vo layout
  ".writer-shell{overflow-wrap:break-word}",
  // 5. Chieu cao co dinh -> toi thieu
  pre(AUTOH) + "{height:auto;min-height:0}",
  // 6. Luoi bang dieu khien: hang phai tu co theo noi dung.
  //    CSS goc dat grid-template-rows theo ti le chieu cao khung nhin (minmax(0,1fr) va
  //    minmax(240px,0.42fr)) nen khi chu xuong dong, noi dung tran ra ngoai panel va bi
  //    panel duoi de len. min-height:min-content khien luoi khong bi ep thap hon noi dung;
  //    .app-view.setup-dashboard von da co overflow-y:auto nen se cuon binh thuong.
  ".writer-shell .setup-dashboard-grid{grid-template-rows:auto auto;min-height:min-content}",
  ".writer-shell .opening-workspace-grid,.writer-shell .writer-workspace{min-height:min-content}",
  // 7. Pipeline: nhan tieng Viet dai hon nen thu lai huy hieu so de nhuong be ngang cho chu
  ".writer-shell .pipeline-map li{padding:9px 10px 8px 34px}",
  ".writer-shell .pipeline-map li>span{top:8px;left:7px;width:20px;height:20px}",
  ".writer-shell .pipeline-map small{font-size:10px;line-height:1.35}",
  // 8. Tren man hinh rong (>=1181px) ban goc xep panel quy trinh vao cot trai hep 414px,
  //    nhan tieng Viet phai xuong 2-3 dong nen cot trai cao vuot man hinh. Dua panel quy trinh
  //    xuong full chieu ngang va trai 6 buoc thanh mot hang — dung cach ban goc da lam o
  //    breakpoint 901-1040px. Nho vay bang dieu khien lai vua mot man hinh.
  "@media (min-width:1181px){" +
    ".writer-shell .project-config-panel{grid-row:1;grid-column:1}" +
    ".writer-shell .workflow-selector-panel{grid-row:1;grid-column:2}" +
    ".writer-shell .pipeline-overview-panel{grid-row:2;grid-column:1/-1}" +
    ".writer-shell .pipeline-map{grid-template-columns:repeat(6,minmax(0,1fr))}" +
    ".writer-shell .pipeline-map li{border-right:1px solid var(--line);border-bottom:0}" +
    ".writer-shell .pipeline-map li:last-child{border-right:0}" +
  "}",
  // 8. Gian chu duong lam chu Latin roi rac
  ".writer-shell .panel-index,.writer-shell .optional-badge,.writer-shell .opening-step-badge{letter-spacing:.02em}",
].join("");

s = s.replace(ANCHOR, ANCHOR.slice(0, -2) + VI_CSS + "\\n");
fs.writeFileSync(F, s);
console.log("Da chen lop CSS tieng Viet (" + VI_CSS.length + " ky tu)");
