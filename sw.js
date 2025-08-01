const CACHE_NAME = "marsoverse-cache-v2";

const urlsToCache = [
  // Main entry points
  "/",
  "/index.html",
  "/mars.html",
  "/marzo.html",
  "/hash.html",
  "/mini.html",
  "/zepta.html",
  "/me.html",
  "/marxo/marxo.html",
  "/black/blacko.html",
  "/poker/poke.html",
  "/poker/poker.html",
  "/snake/snake.html",
  "/space/space.html",

  // mars-viewerr
  "/mars-viewerr/index.html",
  "/mars-viewerr/vite.svg",
  "/mars-viewerr/models/child/scene.gltf", // example model
  "/mars-viewerr/models/mars/scene.gltf",  // repeat for all key models
  "/mars-viewerr/assets/your-asset.png",   // repeat for any asset files

  // mars-viewer/public/models (example)
  "/mars-viewer/public/models/2018_nascar_camaro/scene.gltf",
  "/mars-viewer/public/models/asiannight_city_buildings/scene.gltf",
  "/mars-viewer/public/models/mars_rover/scene.gltf",

  // CSS
  "/styles/main.css",
  "/styles/hash.css",
  "/styles/gv.css",
  "/styles/marzo.css",
  "/poker/poker.css",
  "/snake/snake.css",
  "/space/space.css",

  // JS
  "/scripts/main.js",
  "/scripts/mars.js",
  "/scripts/marzo.js",
  "/scripts/zepta.js",
  "/poker/poker.js",
  "/snake/snake.js",
  "/space/space.js",

  // Sounds (important subset)
  "/sounds/click.mp3",
  "/sounds/asteroid.mp3",
  "/sounds/afterstory.mp3",
  "/sounds/marsostory.mp3",
  "/sounds/typing.mp3",
  "/sounds/intro.mp3",
  "/sounds/sparkle.mp3",
  "/sounds/explosion.mp3",
  "/marsoo.mp4",
  "/moi.mp4",
  "/marshuda.mp4",
  "/marshud.mp4",
  "/marselsa.mp4",
  "/marsanna.mp4",
  "/shacca.mp4",
  "/starry.mp4",
  "/elphaba.mp4",
  "/gaba.mp4",
  "/giga.mp4",
  "/astro.mp4",

  // Images
  "/images/logo-192by222.png",
  "/images/logo512by591.png",
  "/images/icon-192.png",
  "/images/icon-512.png",
  "/images/mars-bg.jpg",
  "/images/title.jpg",

  "/mars-viewer/public/models/mars_one_mission_base/scene.gltf",
  "/mars-viewer/public/models/mars_one_mission_base/scene.bin", // if present
  "/mars-viewer/public/models/mars_one_mission_base/textures/texture.jpg", // replace with actual texture paths

  // Screens
  "/screens/snake.png",
  "/screens/blacko.png",
  "/screens/marxo.png",
  "/screens/poke.png",
  "/screens/spacer.png",

  // Misc media
  "/black/black.png",
  "/poker/pokertable.png",
  "/Earth Explosion.mp4",
  "mars_img/insight.jpg",
  "mars_img/marrr.jpeg",
  "mars_img/marso.jpeg",
    "/scripts/hash.js",
  "/scripts/marzo.js",
  "/styles/zepta.css",
  "/styles/hash.css",
  "/styles/zepta.css",
  "/images/arrow.png",
  "/images/wallet.svg",
  "/images/jeremy.png",
  "/images/jerry.png",
  "/images/jeremiah.png",
  "/images/elena.png",
  "/images/zara.png",
  "/images/gee.png",
  "/images/gia.png",
  "/images/es.png",
  "/images/errin.png",
  "/images/errin1.png",
  "/images/Screenshot (1542).png",
  "/images/Screenshot (1543).png",
  "/images/Screenshot (1544).png",
  "/images/Screenshot (1545).png",
  "/images/Screenshot (1546).png",
  "mars_img/mrove.gif"
];


// Install event: cache files and activate immediately
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event: delete old caches and take control of clients
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch event: serve cached files, else fetch from network and cache
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    // For navigation requests, try cache first fallback to network
    event.respondWith(
      caches.match("/index.html").then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return networkResponse;
      });
    }).catch(error => {
      console.error("Fetch failed:", error);
      // Optional: fallback content for offline here
    })
  );
});
// // Install SW
// self.addEventListener("install", event => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then(cache => {
//       return cache.addAll(urlsToCache);
//     })
//   );
// });self.addEventListener("fetch", event => {
//   event.respondWith(
//     caches.match(event.request).then(cachedResponse => {
//       // Serve from cache if available
//       if (cachedResponse) {
//         return cachedResponse;
//       }

//       // Otherwise, fetch from network and cache it
//       return fetch(event.request).then(networkResponse => {
//         // Only cache valid responses
//         if (
//           !networkResponse ||
//           networkResponse.status !== 200 ||
//           networkResponse.type !== "basic"
//         ) {
//           return networkResponse;
//         }

//         const responseClone = networkResponse.clone();
//         caches.open(CACHE_NAME).then(cache => {
//           cache.put(event.request, responseClone);
//         });

//         return networkResponse;
//       }).catch(error => {
//         console.error("Fetch failed:", error);
//         throw error;
//       });
//     })
//   );
// });
// self.addEventListener("install", event => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
//       .then(() => self.skipWaiting())
//   );
// });

// self.addEventListener("activate", event => {
//   event.waitUntil(self.clients.claim());
// });

