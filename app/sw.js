// Offline cache for Feelascope Right Now. Bump VERSION when files change.
var VERSION = "fsrn-v3";
var FILES = ["./", "index.html", "app.css", "app.js", "config.js", "moments.json", "manifest.webmanifest", "icon-192.png",
  "img/after-school.jpg", "img/bedtime-stall.jpg", "img/tablet-off.jpg", "img/no-everything.jpg", "img/morning-rush.jpg",
  "img/drop-off.jpg", "img/i-hate-you.jpg", "img/hitting.jpg", "img/dark.jpg", "img/dinner.jpg", "img/face-happy.jpg", "img/face-sad.jpg", "img/face-angry.jpg", "img/face-scared.jpg", "img/face-tired.jpg", "img/face-worried.jpg",
  "../fonts/fredoka-latin-600-normal.woff2", "../fonts/nunito-latin-400-normal.woff2", "../fonts/nunito-latin-700-normal.woff2", "../fonts/nunito-latin-800-normal.woff2"];
self.addEventListener("install", function (e) { e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }));
  self.clients.claim();
});
// network first (fresh content), fall back to cache when offline; only same-origin GETs
self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copy = r.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});
