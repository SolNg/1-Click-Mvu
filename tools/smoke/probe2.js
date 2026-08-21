const fs=require("fs"),path=require("path"),http=require("http");
const {chromium}=require("playwright");
require("./prepare")(process.argv[2]||"src/index.vi.js");
const ROOT=path.resolve(__dirname,"../..");
const MIME={".js":"text/javascript",".html":"text/html",".css":"text/css"};
function serve(root){return new Promise(res=>{const s=http.createServer((rq,rp)=>{const f=path.join(root,decodeURIComponent(rq.url.split("?")[0]));fs.readFile(f,(e,d)=>{if(e)return rp.statusCode=404,rp.end("x");rp.setHeader("Content-Type",MIME[path.extname(f)]||"application/octet-stream");rp.end(d);});});s.listen(0,"127.0.0.1",()=>res({port:s.address().port,close:()=>s.close()}));});}
(async()=>{
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
const srv=await serve(ROOT);
const p=await b.newPage({viewport:{width:+(process.env.VW||1280),height:+(process.env.VH||900)}});
await p.goto(`http://127.0.0.1:${srv.port}/tools/smoke/harness.html`);await p.waitForTimeout(1200);
await p.evaluate(()=>{const h=window.__handlers;h[Object.keys(h).find(k=>k.startsWith("button:"))]();});
await p.waitForTimeout(2000);
const f=p.frames().find(x=>x!==p.mainFrame());
console.log(await f.evaluate(()=>{
  const out=[];
  let el=document.querySelector(".setup-dashboard-grid");
  while(el&&el!==document.documentElement){
    const s=getComputedStyle(el);
    out.push(`${el.tagName.toLowerCase()}.${(el.className||"").toString().trim().split(/\s+/).join(".")}  h=${el.clientHeight}/${el.scrollHeight} overflowY=${s.overflowY} flex=${s.flex} minH=${s.minHeight} display=${s.display}`);
    el=el.parentElement;
  }
  out.push("--- cot phai ---");
  const wp=document.querySelector(".workflow-selector-panel");
  (function walk(el,d){ if(d>3)return; for(const c of el.children){ const s=getComputedStyle(c);
    out.push("  ".repeat(d)+c.tagName.toLowerCase()+"."+(c.className||"").toString().trim().split(/\s+/).join(".")+
      `  h=${Math.round(c.getBoundingClientRect().height)} display=${s.display} rows=${s.gridTemplateRows} alignContent=${s.alignContent} flex=${s.flex}`);
    walk(c,d+1);} })(wp,0);
  return out.join("\n");
}));
await b.close();srv.close();
})();
