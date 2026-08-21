const fs=require("fs"),path=require("path"),http=require("http");
const {chromium}=require("playwright");
require("./prepare")(process.argv[2]||"src/index.vi.js");
const ROOT=path.resolve(__dirname,"../..");
const MIME={".js":"text/javascript",".html":"text/html",".css":"text/css"};
function serve(root){return new Promise(res=>{const s=http.createServer((rq,rp)=>{const f=path.join(root,decodeURIComponent(rq.url.split("?")[0]));fs.readFile(f,(e,d)=>{if(e)return rp.statusCode=404,rp.end("x");rp.setHeader("Content-Type",MIME[path.extname(f)]||"application/octet-stream");rp.end(d);});});s.listen(0,"127.0.0.1",()=>res({port:s.address().port,close:()=>s.close()}));});}
(async()=>{
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
const srv=await serve(ROOT);
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto(`http://127.0.0.1:${srv.port}/tools/smoke/harness.html`);await p.waitForTimeout(1200);
await p.evaluate(()=>{const h=window.__handlers;h[Object.keys(h).find(k=>k.startsWith("button:"))]();});
await p.waitForTimeout(2200);
const f=p.frames().find(x=>x!==p.mainFrame());
const before=await f.evaluate(()=>({w:document.documentElement.clientWidth,meta:!!document.querySelector("meta[name=viewport]")}));
console.log("TRUOC khi them meta:",JSON.stringify(before));
await p.screenshot({path:"tools/smoke/mobile-truoc.png"});
// Them meta viewport roi do lai
await f.evaluate(()=>{const m=document.createElement("meta");m.name="viewport";m.content="width=device-width, initial-scale=1";document.head.appendChild(m);});
await p.waitForTimeout(800);
const after=await f.evaluate(()=>({w:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
console.log("SAU khi them meta:",JSON.stringify(after));
await p.screenshot({path:"tools/smoke/mobile-sau.png"});
await b.close();srv.close();
})();
