/* OWQ Station service worker: network first for the portal page (so every update arrives at once), last good copy when
   offline. Only same-origin GET requests; Firebase, prices and everything else go straight to the network. */
var C='owq-shell-v1',SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','install.html'];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(C).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(new Request(u,{cache:'reload'})).catch(function(){})}))}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==C}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!=='GET')return;var u=new URL(r.url);if(u.origin!==location.origin)return;
 if(/\/(version\.txt|fakefb-[a-z]+\.js|keep\.html)$/.test(u.pathname))return;
 e.respondWith(fetch(r).then(function(res){if(res&&res.ok&&(r.mode==='navigate'||SHELL.some(function(s){return u.pathname.endsWith('/'+s.replace('./',''))}))){var cp=res.clone();caches.open(C).then(function(c){c.put(r.mode==='navigate'?new Request(u.pathname.endsWith('install.html')?'install.html':'index.html'):r,cp)})}return res})
  ['catch'](function(){return caches.match(r,{ignoreSearch:true}).then(function(m){return m||(r.mode==='navigate'?caches.match('index.html'):undefined)||Response.error()})}))});
