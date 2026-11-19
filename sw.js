// V8: HTML e metadados sempre priorizam a rede; offline usa ultimo cache.
const CACHE='ygo-inventario-v8';
const CORE=['./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./version.json'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(async cache=>{
  await Promise.all(CORE.map(async path=>{try{const r=await fetch(path,{cache:'reload'});if(r.ok)await cache.put(path,r)}catch(e){/* sem rede: manter instalacao possivel */}}));
 }));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('ygo-inventario-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin)return;
 const isHTML=req.mode==='navigate'||url.pathname.endsWith('/index.html');
 const isVersion=url.pathname.endsWith('/version.json');
 if(isHTML||isVersion){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   try{
    const response=await fetch(req,{cache:'no-store'});
    if(response.ok)await cache.put(isHTML?'./index.html':'./version.json',response.clone());
    return response;
   }catch(err){return (await cache.match(isHTML?'./index.html':'./version.json'))||Response.error()}
  })());
 }else{
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   const cached=await cache.match(req);
   if(cached)return cached;
   try{const response=await fetch(req);if(response.ok)await cache.put(req,response.clone());return response}catch(e){return Response.error()}
  })());
 }
});
