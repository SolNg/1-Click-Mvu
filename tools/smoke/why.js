const fs=require("fs"),path=require("path"),http=require("http");
const {chromium}=require("playwright");
require("./prepare")();
const ROOT=path.resolve("/home/user/1-Click-Mvu");
const MIME={".js":"text/javascript",".html":"text/html",".json":"application/json",".css":"text/css"};
function serve(root){return new Promise(res=>{const s=http.createServer((rq,rp)=>{const f=path.join(root,decodeURIComponent(rq.url.split("?")[0]));fs.readFile(f,(e,d)=>{if(e)return rp.statusCode=404,rp.end("x");rp.setHeader("Content-Type",MIME[path.extname(f)]||"application/octet-stream");rp.end(d);});});s.listen(0,"127.0.0.1",()=>res({port:s.address().port,close:()=>s.close()}));});}
(async()=>{
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
const srv=await serve(ROOT);const p=await b.newPage({viewport:{width:1280,height:900}});
await p.goto(`http://127.0.0.1:${srv.port}/tools/smoke/harness.html`);await p.waitForTimeout(1200);
await p.evaluate(()=>{const h=window.__handlers;h[Object.keys(h).find(k=>k.startsWith("button:"))]();});
await p.waitForTimeout(2200);
const f=p.frames().find(x=>x!==p.mainFrame());
const r=await f.evaluate(()=>{
  const el=[...document.querySelectorAll("small")].find(e=>e.textContent.includes("Nhân vật & world book"));
  const st=[...document.querySelectorAll("strong")].find(e=>e.textContent.includes("Dựng thế giới"));
  function why(node){
    if(!node) return "khong tim thay";
    const out=[];
    for(const sheet of document.styleSheets){
      let rules; try{rules=sheet.cssRules}catch(e){continue}
      for(const rule of rules){
        if(!rule.selectorText||!rule.style) continue;
        if(!/font-size|white-space/.test(rule.style.cssText)) continue;
        try{ if(node.matches(rule.selectorText)) out.push(rule.selectorText+" { "+rule.style.cssText+" }"); }catch(e){}
      }
    }
    const chain=[];let x=node;while(x&&x!==document.body){chain.unshift(x.tagName.toLowerCase()+(x.className&&x.className.toString?("."+x.className.toString().trim().split(/\s+/).join(".")):""));x=x.parentElement;}
    return {path:chain.join(" > "), rules:out, computed:getComputedStyle(node).whiteSpace};
  }
  const sheets=[...document.styleSheets].map((sh,i)=>{
    let n=0,hasVi=false,hasNowrap=-1;
    try{const rs=[...sh.cssRules]; n=rs.length;
      rs.forEach((r,j)=>{ if(r.cssText&&r.cssText.includes("overflow-wrap: break-word")) hasVi=true;
        if(r.selectorText===".sidebar-nav-item small"&&/nowrap/.test(r.style?.cssText||"")) hasNowrap=j; });
    }catch(e){}
    return {i,n,hasVi,nowrapAt:hasNowrap, owner:sh.ownerNode&&sh.ownerNode.getAttribute&&sh.ownerNode.getAttribute("script_id")};
  });
  return {sheets2:sheets, small:why(el), strong:why(st), sheets:document.styleSheets.length,
    hasViLayer:[...document.styleSheets].some(s=>{try{return [...s.cssRules].some(r=>r.cssText&&r.cssText.includes("overflow-wrap: break-word"))}catch(e){return false}})};
});
console.log(JSON.stringify(r,null,1));
await b.close();srv.close();
})();
