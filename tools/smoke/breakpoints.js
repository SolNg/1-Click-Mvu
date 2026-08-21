// Kiem tra layout o moi breakpoint cua thiet ke.
const fs=require("fs"),path=require("path"),http=require("http");
const {chromium}=require("playwright");
const target=process.argv[2]||"src/index.vi.js";
require("./prepare")(target);
const ROOT=path.resolve(__dirname,"../..");
const MIME={".js":"text/javascript",".html":"text/html",".css":"text/css"};
function serve(root){return new Promise(res=>{const s=http.createServer((rq,rp)=>{const f=path.join(root,decodeURIComponent(rq.url.split("?")[0]));fs.readFile(f,(e,d)=>{if(e)return rp.statusCode=404,rp.end("x");rp.setHeader("Content-Type",MIME[path.extname(f)]||"application/octet-stream");rp.end(d);});});s.listen(0,"127.0.0.1",()=>res({port:s.address().port,close:()=>s.close()}));});}
const SIZES=[[1600,1000],[1280,900],[1100,860],[1000,820],[950,800],[880,780],[700,900],[520,900],[390,844]];
(async()=>{
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
const srv=await serve(ROOT);
let bad=0;
console.log("khung nhin   cat_chu  tran_panel  tran_ngang  panel_chong  cao_luoi/khung");
for(const [W,H] of SIZES){
  const p=await b.newPage({viewport:{width:W,height:H},isMobile:W<700,hasTouch:W<700});
  await p.goto(`http://127.0.0.1:${srv.port}/tools/smoke/harness.html`);await p.waitForTimeout(900);
  await p.evaluate(()=>{const h=window.__handlers;h[Object.keys(h).find(k=>k.startsWith("button:"))]();});
  await p.waitForTimeout(1700);
  const f=p.frames().find(x=>x!==p.mainFrame());
  const r=await f.evaluate(()=>{
    const clip=[...document.querySelectorAll(".writer-shell *")].filter(e=>e.children.length===0&&(e.textContent||"").trim()&&e.scrollWidth>e.clientWidth+1);
    const spill=[...document.querySelectorAll(".setup-dashboard-grid *")].filter(el=>{
      const pn=el.closest(".setup-dashboard-grid > *"); if(!pn||pn===el||el.children.length) return false;
      if(!(el.textContent||"").trim()) return false;
      return el.getBoundingClientRect().bottom > pn.getBoundingClientRect().bottom+1;});
    const panels=[...document.querySelectorAll(".setup-dashboard-grid > *")];
    let ov=0;
    for(let i=0;i<panels.length;i++)for(let j=i+1;j<panels.length;j++){
      const a=panels[i].getBoundingClientRect(),c=panels[j].getBoundingClientRect();
      const w=Math.min(a.right,c.right)-Math.max(a.left,c.left), h=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);
      if(w>2&&h>2) ov+=Math.round(w*h);}
    const g=document.querySelector(".setup-dashboard-grid");
    const view=document.querySelector(".app-view.setup-dashboard");
    return {clip:clip.length, clipTxt:clip.slice(0,2).map(e=>e.textContent.trim().slice(0,26)),
      spill:spill.length, spillTxt:spill.slice(0,2).map(e=>e.textContent.trim().slice(0,26)),
      wide:document.documentElement.scrollWidth>document.documentElement.clientWidth+1, ov,
      gh:g?g.scrollHeight:0, vh:view?view.clientHeight:0};
  });
  const flag = r.clip||r.spill||r.wide||r.ov;
  if(flag) bad++;
  console.log(`${String(W+"x"+H).padEnd(12)} ${String(r.clip).padStart(6)}  ${String(r.spill).padStart(9)}  ${String(r.wide).padStart(10)}  ${String(r.ov).padStart(11)}  ${r.gh}/${r.vh}${flag?"   <-- "+JSON.stringify([...r.clipTxt,...r.spillTxt]):""}`);
  await p.close();
}
await b.close();srv.close();
console.log(bad?`\n=> ${bad} khung nhin co van de`:"\n=> Moi khung nhin deu sach");
process.exit(bad?1:0);
})();
