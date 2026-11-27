const C="vdw-v44";
const SHELL=["./","./index.html","./style.css?v=44","./app.js?v=44","./arch3d.js","./profile.json","./portrait.jpg","./og.jpg","./qr.svg","./qr.png","./anton-400.woff2","./jost-400.woff2","./jost-500.woff2","./jost-600.woff2","./mukta-800.woff2","./icon.svg","./icon-180.png","./icon-512.png","./contact.vcf","./slate.html","./manifest.webmanifest"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET")return;
  const url=new URL(r.url);
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put("./index.html",cp));return res}).catch(()=>caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>{
    if(hit){fetch(r).then(res=>{if(res.ok)caches.open(C).then(c=>c.put(r,res))}).catch(()=>{});return hit}
    return fetch(r).then(res=>{if(res.ok&&(url.origin===location.origin||url.hostname.endsWith("unpkg.com"))){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>hit)
  }));
});
