const fs=require("fs"),path=require("path"),http=require("http");
const {chromium}=require("playwright");
const target=process.argv[2]||"src/index.vi.js";
require("./prepare")(target);
const ROOT=path.resolve(__dirname,"../..");
const MIME={".js":"text/javascript",".html":"text/html",".css":"text/css"};
function serve(root){return new Promise(res=>{const s=http.createServer((rq,rp)=>{const f=path.join(root,decodeURIComponent(rq.url.split("?")[0]));fs.readFile(f,(e,d)=>{if(e)return rp.statusCode=404,rp.end("x");rp.setHeader("Content-Type",MIME[path.extname(f)]||"application/octet-stream");rp.end(d);});});s.listen(0,"127.0.0.1",()=>res({port:s.address().port,close:()=>s.close()}));});}
(async()=>{
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
const srv=await serve(ROOT);
const W=+(process.env.VW||1280),H=+(process.env.VH||900);
const p=await b.newPage({viewport:{width:W,height:H}});
await p.goto(`http://127.0.0.1:${srv.port}/tools/smoke/harness.html`);await p.waitForTimeout(1200);
await p.evaluate(()=>{const h=window.__handlers;h[Object.keys(h).find(k=>k.startsWith("button:"))]();});
await p.waitForTimeout(2200);
const f=p.frames().find(x=>x!==p.mainFrame());
const r=await f.evaluate(()=>{
  const grid=document.querySelector(".setup-dashboard-grid");
  const cs=grid?getComputedStyle(grid):null;
  const panels=[...document.querySelectorAll(".setup-dashboard-grid > *")].map(el=>{
    const b=el.getBoundingClientRect(), s=getComputedStyle(el);
    return {cls:(el.className||"").toString().slice(0,46), top:Math.round(b.top), bottom:Math.round(b.bottom),
      left:Math.round(b.left), right:Math.round(b.right),
      clientH:el.clientHeight, scrollH:el.scrollHeight, overflow:s.overflow, gridRow:s.gridRow, gridCol:s.gridColumn};
  });
  // Phan tu con nao ve ra ngoai day panel cha
  const spill=[];
  for (const el of document.querySelectorAll(".setup-dashboard-grid *")) {
    const panel = el.closest(".setup-dashboard-grid > *");
    if (!panel || panel === el) continue;
    if (el.children.length) continue;
    const t=(el.textContent||"").trim(); if(!t) continue;
    const a=el.getBoundingClientRect(), pb=panel.getBoundingClientRect();
    if (a.bottom > pb.bottom + 1) spill.push({txt:t.slice(0,46), over:Math.round(a.bottom-pb.bottom), panel:(panel.className||"").toString().slice(0,30)});
  }
  return {gridTemplateRows:cs&&cs.gridTemplateRows, gridTemplateColumns:cs&&cs.gridTemplateColumns, gridAutoRows:cs&&cs.gridAutoRows, alignItems:cs&&cs.alignItems, panels, spill};
});
console.log("grid-template-columns:", r.gridTemplateColumns);
console.log("grid-template-rows   :", r.gridTemplateRows);
console.log("grid-auto-rows       :", r.gridAutoRows, "| align-items:", r.alignItems);
console.log("\n--- Cac panel trong luoi ---");
r.panels.forEach(x=>console.log(`  ${x.cls.padEnd(46)} y=${String(x.top).padStart(4)}..${String(x.bottom).padStart(4)}  x=${String(x.left).padStart(4)}..${String(x.right).padStart(4)}  clientH=${x.clientH} scrollH=${x.scrollH} overflow=${x.overflow} row=${x.gridRow}`));
console.log("\n--- Chu ve tran ra ngoai day panel (" + r.spill.length + ") ---");
r.spill.forEach(x=>console.log(`  +${x.over}px  [${x.panel}]  ${JSON.stringify(x.txt)}`));
await b.close();srv.close();
})();
