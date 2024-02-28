var VERSION = 'v2';

var cacheFiles = [
/*  "https://cdnjs.cloudflare.com/ajax/libs/engine.io-client/3.2.1/engine.io.min.js",

  self.registration.scope,
  self.registration.scope+'js/util/canvas2d.js',
  self.registration.scope+'js/runtime/runtime.js',
  self.registration.scope+'js/runtime/screen.js',
  self.registration.scope+'js/runtime/sprite.js',
  self.registration.scope+'js/runtime/audio/audio.js',
  self.registration.scope+'js/runtime/audio/beeper.js',
  self.registration.scope+'js/play/player.js',
  self.registration.scope+'js/play/playerclient.js',
  self.registration.scope+'sw.js'*/
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => {
      return cache.addAll(cacheFiles);
    })
  );
});

self.addEventListener('fetch', function(event) {
  //console.info(event.request);
  if (event.request.method != "GET" || event.request.url.indexOf("/engine.io/")>0)
  {
    return event.respondWith(fetch(event.request)) ;
  }

  /* cache then network with caching */
  event.respondWith(
    caches.open(VERSION).then(function(cache) {
      return cache.match(event.request).then(function(response) {
        var fetchPromise = fetch(event.request).then(function(networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        return response || fetchPromise;
      })
    })
  );
});

// 这段代码是一个 Service Worker 的脚本，主要实现了静态文件的缓存和缓存优先策略。它的主要功能包括：

// 1. 定义了一个缓存版本号 `VERSION` 和需要缓存的文件列表 `cacheFiles`（被注释掉了）。
// 2. 在 `install` 事件监听器中，使用 `caches.open(VERSION)` 打开指定版本的缓存，并将指定文件列表添加到缓存中。
// 3. 在 `fetch` 事件监听器中，首先检查请求方法是否为 GET 方法以及请求 URL 是否包含 "/engine.io/"，如果是则直接返回对请求的 fetch；否则执行缓存优先策略：尝试从缓存中匹配请求，如果匹配到了就直接返回缓存的响应；如果缓存中没有匹配到，则向网络请求资源，并将响应存入缓存，然后再返回响应。