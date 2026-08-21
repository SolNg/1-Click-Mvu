// Thu nghiem CSS truc tiep trong trinh duyet, do chieu cao ket qua truoc khi quyet dinh.
const fs=require("fs"),path=require("path"),http=require("http");
const {chromium}=require("playwright");
require("./prepare")("src/index.vi.js");
const ROOT=path.resolve(__dirname,"../..");
const MIME={".js":"text/javascript",".html":"text/html",".css":"text/css"};
function serve(root){return new Promise(res=>{const s=http.createServer((rq,rp)=>{const f=path.join(root,decodeURIComponent(rq.url.split("?")[0]));fs.readFile(f,(e,d)=>{if(e)return rp.statusCode=404,rp.end("x");rp.setHeader("Content-Type",MIME[path.extname(f)]||"application/octet-stream");rp.end(d);});});s.listen(0,"127.0.0.1",()=>res({port:s.address().port,close:()=>s.close()}));});}
const VARIANTS = {
  "hien tai (pipeline cot trai)": "",
  "pipeline full ngang, 6 cot": ".writer-shell .pipeline-overview-panel{grid-column:1/-1;grid-row:2}.writer-shell .workflow-selector-panel{grid-row:1}.writer-shell .pipeline-map{grid-template-columns:repeat(6,minmax(0,1fr))}.writer-shell .pipeline-map li{border-right:1px solid var(--line)}.writer-shell .pipeline-map li:last-child{border-right:0}",
  "pipeline full ngang, 3 cot": ".writer-shell .pipeline-overview-panel{grid-column:1/-1;grid-row:2}.writer-shell .workflow-selector-panel{grid-row:1}",
  "full ngang 6 cot + small 10px": ".writer-shell .pipeline-overview-panel{grid-column:1/-1;grid-row:2}.writer-shell .workflow-selector-panel{grid-row:1}.writer-shell .pipeline-map{grid-template-columns:repeat(6,minmax(0,1fr))}.writer-shell .pipeline-map li{border-right:1px solid var(--line)}.writer-shell .pipeline-map li:last-child{border-right:0}.writer-shell .pipeline-map small{font-size:10px;line-height:1.35}",
};
(async()=>{
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
const srv=await serve(ROOT);
for (const [name, css] of Object.entries(VARIANTS)) {
  const p=await b.newPage({viewport:{width:1280,height:900}});
  await p.goto(`http://127.0.0.1:${srv.port}/tools/smoke/harness.html`);await p.waitForTimeout(1000);
  await p.evaluate(()=>{const h=window.__handlers;h[Object.keys(h).find(k=>k.startsWith("button:"))]();});
  await p.waitForTimeout(1800);
  const f=p.frames().find(x=>x!==p.mainFrame());
  if (css) await f.evaluate((c)=>{const s=document.createElement("style");s.textContent=c;document.head.appendChild(s);},css);
  await p.waitForTimeout(400);
  const r=await f.evaluate(()=>{
    const g=document.querySelector(".setup-dashboard-grid");
    const view=document.querySelector(".app-view.setup-dashboard");
    const pipe=document.querySelector(".pipeline-overview-panel");
    const spill=[...document.querySelectorAll(".setup-dashboard-grid *")].filter(el=>{
      const pn=el.closest(".setup-dashboard-grid > *"); if(!pn||pn===el||el.children.length) return false;
      if(!(el.textContent||"").trim()) return false;
      return el.getBoundingClientRect().bottom > pn.getBoundingClientRect().bottom+1;}).length;
    const clip=[...document.querySelectorAll(".writer-shell *")].filter(e=>e.children.length===0&&(e.textContent||"").trim()&&e.scrollWidth>e.clientWidth+1).length;
    return {gridH:g.scrollHeight, viewH:view.clientHeight, viewScroll:view.scrollHeight, pipeH:pipe.getBoundingClientRect().height, spill, clip};
  });
  console.log(`${name.padEnd(20)} luoi=${r.gridH}px  pipeline=${Math.round(r.pipeH)}px  view=${r.viewH}/${r.viewScroll}${r.viewScroll>r.viewH?" (phai cuon)":" (vua man hinh)"}  tran=${r.spill}  cat_chu=${r.clip}`);
  await p.close();
}
await b.close();srv.close();
})();
