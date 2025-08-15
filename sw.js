const CACHE_NAME = "marsoverse-cache-v6";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

// Core files that MUST be cached for basic functionality
const criticalFiles = [
  // HTML Pages - All your game pages
  "/",
  "/index.html",
  "/admin.html",
  "/mars.html",
  "/marzo.html",
  "/hash.html",
  "/mini.html",
  "/zepta.html",
  "/me.html",
  "/moi.html",
  "/zeep.html",
  "/zepter.html",
  "/marxo/marxo.html",
  "/black/blacko.html",
  "/poker/poke.html",
  "/poker/poker.html",
  "/snake/snake.html",
  "/space/space.html",
  "/mars-viewer/dist/index.html",
  "/mars-viewerr/index.html",

  // CSS - All styling files
  "/styles/main.css",
  "/styles/hash.css",
  "/styles/gv.css",
  "/styles/marzo.css",
  "/styles/zepta.css",
  "/poker/poker.css",
  "/snake/snake.css",
  "/space/space.css",

  // JavaScript - All game logic
  "/scripts/main.js",
  "/scripts/mars.js",
  "/scripts/marzo.js",
  "/scripts/zepta.js",
  "/scripts/hash.js",
  "/poker/poker.js",
  "/snake/snake.js",
  "/space/space.js",
  "/config.js",

  // Essential Images and Icons
  "/images/logo-192by222.png",
  "/images/logo512by591.png",
  "/images/icon-192.png",
  "/images/icon-512.png",
  "/mars-viewerr/vite.svg"
];

// Known large video files that should be excluded (likely >50MB)
const knownLargeFiles = [
  "/marsoo.mp4",
  "/moi.mp4",
  "/marshuda.mp4",
  "/marshud.mp4",
  "/marselsa.mp4",
  "/marsanna.mp4",
  "/shaca.mp4",
  "/starry.mp4",
  "/elphaba.mp4",
  "/gaba.mp4",
  "/giga.mp4",
  "/astro.mp4",
  "/Earth Explosion.mp4"
];

// File extensions that are typically safe to cache
const cacheableExtensions = [
  '.html', '.htm', '.css', '.js', '.json', '.xml',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  '.mp3', '.wav', '.ogg', '.m4a',
  '.gltf', '.bin', '.glb', '.obj', '.mtl',
  '.woff', '.woff2', '.ttf', '.eot',
  '.txt', '.md'
];

// Check if file should be excluded based on known large files
function isKnownLargeFile(url) {
  return knownLargeFiles.some(largeFile => url.includes(largeFile));
}

// Check if file extension is cacheable
function hasCacheableExtension(url) {
  const urlPath = new URL(url, self.location.origin).pathname.toLowerCase();
  return cacheableExtensions.some(ext => urlPath.endsWith(ext)) || urlPath === '/' || !urlPath.includes('.');
}

// Check if response is too large to cache
function isResponseTooLarge(response) {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10) > MAX_FILE_SIZE;
  }
  return false; // If we can't determine size, allow caching
}

// Enhanced install event - cache critical files first
self.addEventListener("install", event => {
  console.log("🚀 Installing Marsoverse Service Worker v6...");
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("📦 Caching critical files...");
        return cache.addAll(criticalFiles);
      })
      .then(() => {
        console.log("✅ Critical files cached successfully");
        return self.skipWaiting();
      })
      .catch(error => {
        console.error("❌ Failed to cache critical files:", error);
        // Try to cache as many critical files as possible individually
        return caches.open(CACHE_NAME).then(cache => {
          return Promise.allSettled(
            criticalFiles.map(url => 
              fetch(url).then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              }).catch(err => {
                console.warn(`⚠️  Failed to cache critical file: ${url}`, err);
              })
            )
          ).then(() => self.skipWaiting());
        });
      })
  );
});

// Enhanced activate event
self.addEventListener("activate", event => {
  console.log("🔄 Activating Marsoverse Service Worker...");
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log(`🗑️  Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        )
      ),
      // Take control of all clients
      self.clients.claim().then(() => {
        console.log("🎮 Service Worker now controlling all clients");
      })
    ])
  );
});

// Smart fetch strategy - cache everything that's reasonable
self.addEventListener("fetch", event => {
  const requestUrl = event.request.url;
  const requestMethod = event.request.method;

  // Only handle GET requests
  if (requestMethod !== 'GET') {
    return;
  }

  // Skip caching for known large files
  if (isKnownLargeFile(requestUrl)) {
    console.log(`⏭️  Skipping large file: ${requestUrl}`);
    event.respondWith(fetch(event.request));
    return;
  }

  // Handle navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request)
        .then(cachedPage => {
          if (cachedPage) {
            console.log(`📄 Serving cached navigation: ${requestUrl}`);
            return cachedPage;
          }
          
          // Try to fetch and cache the navigation request
          return fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Fallback to index.html for offline navigation
              console.log(`🏠 Offline fallback to index.html for: ${requestUrl}`);
              return caches.match("/index.html");
            });
        })
    );
    return;
  }

  // Handle all other requests with smart caching
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log(`💾 Cache hit: ${requestUrl}`);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log(`🌐 Fetching from network: ${requestUrl}`);
        return fetch(event.request)
          .then(networkResponse => {
            // Check if we should cache this response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
              return networkResponse;
            }

            // Check if file extension is cacheable
            if (!hasCacheableExtension(requestUrl)) {
              console.log(`🚫 Skipping non-cacheable extension: ${requestUrl}`);
              return networkResponse;
            }

            // Check if response is too large
            if (isResponseTooLarge(networkResponse)) {
              console.log(`📏 File too large to cache: ${requestUrl}`);
              return networkResponse;
            }

            // Cache the response
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log(`💾 Caching new file: ${requestUrl}`);
                return cache.put(event.request, responseClone);
              })
              .catch(err => {
                console.warn(`⚠️  Failed to cache: ${requestUrl}`, err);
              });

            return networkResponse;
          })
          .catch(error => {
            console.warn(`❌ Network fetch failed: ${requestUrl}`, error);
            
            // For failed requests, try to serve a reasonable fallback
            if (requestUrl.includes('.html') || event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match("/index.html");
            }
            
            // For other files, just let the error through
            throw error;
          });
      })
  );
});

// Enhanced push notification handling
self.addEventListener("push", event => {
  console.log("🔔 Push notification received");
  
  const data = event.data ? event.data.json() : { 
    title: "Marsoverse", 
    body: "Your Mars game is ready to play offline!" 
  };
  
  const options = {
    body: data.body,
    icon: "/images/icon-192.png",
    badge: "/images/icon-192.png",
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || "/index.html",
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'play',
        title: '🎮 Play Now',
        icon: '/images/icon-192.png'
      },
      {
        action: 'close',
        title: '❌ Close'
      }
    ],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Enhanced notification click handling
self.addEventListener("notificationclick", event => {
  console.log("🖱️  Notification clicked:", event.action);
  event.notification.close();
  
  if (event.action === 'close') {
    return; // Just close the notification
  }
  
  // For 'play' action or general click
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        const url = event.notification.data.url || "/index.html";
        
        // Check if game is already open
        for (const client of clientList) {
          if (client.url.includes(new URL(url, self.location.origin).pathname) && "focus" in client) {
            console.log("🎯 Focusing existing game window");
            return client.focus();
          }
        }
        
        // Open new game window
        if (clients.openWindow) {
          console.log("🚀 Opening new game window");
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync for progressive enhancement
self.addEventListener("sync", event => {
  if (event.tag === "background-sync") {
    console.log("🔄 Background sync triggered");
    
    event.waitUntil(
      // Pre-cache additional assets when connection is restored
      fetch("/").then(() => {
        console.log("🌐 Connection restored, pre-caching additional assets");
        // You can add logic here to cache additional assets
        return Promise.resolve();
      }).catch(() => {
        console.log("📱 Still offline");
      })
    );
  }
});

// Cache size management
async function manageCacheSize() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    console.log(`📊 Current cache size: ${requests.length} files`);
    
    // If cache is getting too large (adjust threshold as needed)
    if (requests.length > 500) {
      console.log("🧹 Cache cleanup initiated");
      
      // Remove oldest cached files that aren't critical
      const nonCriticalRequests = requests.filter(req => 
        !criticalFiles.some(criticalFile => req.url.includes(criticalFile))
      );
      
      // Remove oldest 25% of non-critical files
      const toDelete = nonCriticalRequests.slice(0, Math.floor(nonCriticalRequests.length * 0.25));
      
      await Promise.all(toDelete.map(req => {
        console.log(`🗑️  Removing from cache: ${req.url}`);
        return cache.delete(req);
      }));
      
      console.log(`✅ Cache cleanup complete. Removed ${toDelete.length} files`);
    }
  } catch (error) {
    console.error("❌ Cache management failed:", error);
  }
}

// Message handling for cache management and status
self.addEventListener("message", event => {
  console.log("💬 Message received:", event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case "MANAGE_CACHE":
        event.waitUntil(manageCacheSize());
        break;
        
      case "GET_CACHE_STATUS":
        event.waitUntil(
          caches.open(CACHE_NAME).then(cache => {
            return cache.keys().then(requests => {
              event.ports[0].postMessage({
                type: "CACHE_STATUS",
                cacheSize: requests.length,
                cacheName: CACHE_NAME
              });
            });
          })
        );
        break;
        
      case "CLEAR_CACHE":
        event.waitUntil(
          caches.delete(CACHE_NAME).then(() => {
            console.log("🧹 Cache cleared by request");
            event.ports[0].postMessage({ type: "CACHE_CLEARED" });
          })
        );
        break;
        
      default:
        console.log("❓ Unknown message type:", event.data.type);
    }
  }
});

// Periodic cache management (runs every 30 minutes when active)
let cacheManagementInterval;

self.addEventListener("activate", () => {
  // Set up periodic cache management
  if (cacheManagementInterval) {
    clearInterval(cacheManagementInterval);
  }
  
  cacheManagementInterval = setInterval(() => {
    manageCacheSize();
  }, 30 * 60 * 1000); // 30 minutes
});

console.log("🎮 Marsoverse Service Worker v6 loaded and ready!");
console.log("🌟 Features: Smart caching, size limits, offline-first gaming!");
console.log(`📏 Max file size for caching: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);


// const CACHE_NAME = "marsoverse-cache-v4";

// const urlsToCache = [
//   // HTML Pages
//   "/",
//   "/index.html",
//   "/admin.html",
//   "/mars.html",
//   "/marzo.html",
//   "/hash.html",
//   "/mini.html",
//   "/zepta.html",
//   "/me.html",
//   "/moi.html",
//   "/zeep.html",
//   "/zepter.html",
//   "/marxo/marxo.html",
//   "/black/blacko.html",
//   "/poker/poke.html",
//   "/poker/poker.html",
//   "/snake/snake.html",
//   "/space/space.html",
//   "/mars-viewer/dist/index.html",
//   "/mars-viewerr/index.html",

//   // CSS
//   "/styles/main.css",
//   "/styles/hash.css",
//   "/styles/gv.css",
//   "/styles/marzo.css",
//   "/styles/zepta.css",
//   "/poker/poker.css",
//   "/snake/snake.css",
//   "/space/space.css",

//   // JavaScript
//   "/scripts/main.js",
//   "/scripts/mars.js",
//   "/scripts/marzo.js",
//   "/scripts/zepta.js",
//   "/scripts/hash.js",
//   "/poker/poker.js",
//   "/snake/snake.js",
//   "/space/space.js",
//   "/config.js",

//   // Images
//   "/images/logo-192by222.png",
//   "/images/logo512by591.png",
//   "/images/icon-192.png",
//   "/images/icon-512.png",
//   "/images/mars-bg.jpg",
//   "/images/title.jpg",
//   "/images/arrow.png",
//   "/images/wallet.svg",
//   "/images/jeremy.png",
//   "/images/jerry.png",
//   "/images/jeremiah.png",
//   "/images/elena.png",
//   "/images/zara.png",
//   "/images/gee.png",
//   "/images/gia.png",
//   "/images/es.png",
//   "/images/errin.png",
//   "/images/errin1.png",
//   "/images/Screenshot (1542).png",
//   "/images/Screenshot (1543).png",
//   "/images/Screenshot (1544).png",
//   "/images/Screenshot (1545).png",
//   "/images/Screenshot (1546).png",
//   "/mars_img/insight.jpg",
//   "/mars_img/marrr.jpeg",
//   "/mars_img/marso.jpeg",
//   "/mars_img/mrove.gif",
//   "/black/black.png",
//   "/poker/pokertable.png",
//   "/screens/snake.png",
//   "/screens/blacko.png",
//   "/screens/marxo.png",
//   "/screens/poke.png",
//   "/screens/spacer.png",
//   "/mars-viewerr/vite.svg",
//   "/mars-viewerr/assets/your-asset.png",

//   // Sounds and Videos
//   "/sounds/click.mp3",
//   "/sounds/asteroid.mp3",
//   "/sounds/afterstory.mp3",
//   "/sounds/marsostory.mp3",
//   "/sounds/typing.mp3",
//   "/sounds/intro.mp3",
//   "/sounds/sparkle.mp3",
//   "/sounds/explosion.mp3",
//   "/marsoo.mp4",
//   "/moi.mp4",
//   "/marshuda.mp4",
//   "/marshud.mp4",
//   "/marselsa.mp4",
//   "/marsanna.mp4",
//   "/shaca.mp4",
//   "/starry.mp4",
//   "/elphaba.mp4",
//   "/gaba.mp4",
//   "/giga.mp4",
//   "/astro.mp4",
//   "/Earth Explosion.mp4",

//   // Models (mars-viewer/dist/models)
//   "/mars-viewer/dist/models/2018_nascar_camaro/scene.gltf",
//   "/mars-viewer/dist/models/2018_nascar_camaro/scene.bin",
//   "/mars-viewer/dist/models/2018_nascar_camaro/textures/texture.jpg",
//   "/mars-viewer/dist/models/asiannight_city_buildings/scene.gltf",
//   "/mars-viewer/dist/models/asiannight_city_buildings/scene.bin",
//   "/mars-viewer/dist/models/asiannight_city_buildings/textures/texture.jpg",
//   "/mars-viewer/dist/models/bubble_space_ship/scene.gltf",
//   "/mars-viewer/dist/models/bubble_space_ship/scene.bin",
//   "/mars-viewer/dist/models/bubble_space_ship/textures/texture.jpg",
//   "/mars-viewer/dist/models/businessman/scene.gltf",
//   "/mars-viewer/dist/models/businessman/scene.bin",
//   "/mars-viewer/dist/models/businessman/textures/texture.jpg",
//   "/mars-viewer/dist/models/child/scene.gltf",
//   "/mars-viewer/dist/models/child/scene.bin",
//   "/mars-viewer/dist/models/child/textures/texture.jpg",
//   "/mars-viewer/dist/models/city_buildings/scene.gltf",
//   "/mars-viewer/dist/models/city_buildings/scene.bin",
//   "/mars-viewer/dist/models/city_buildings/textures/texture.jpg",
//   "/mars-viewer/dist/models/franz_viehbocks_spacesuit/scene.gltf",
//   "/mars-viewer/dist/models/franz_viehbocks_spacesuit/scene.bin",
//   "/mars-viewer/dist/models/franz_viehbocks_spacesuit/textures/texture.jpg",
//   "/mars-viewer/dist/models/girl/scene.gltf",
//   "/mars-viewer/dist/models/girl/scene.bin",
//   "/mars-viewer/dist/models/girl/textures/texture.jpg",
//   "/mars-viewer/dist/models/man/scene.gltf",
//   "/mars-viewer/dist/models/man/scene.bin",
//   "/mars-viewer/dist/models/man/textures/texture.jpg",
//   "/mars-viewer/dist/models/man2/scene.gltf",
//   "/mars-viewer/dist/models/man2/scene.bin",
//   "/mars-viewer/dist/models/man2/textures/texture.jpg",
//   "/mars-viewer/dist/models/mars/scene.gltf",
//   "/mars-viewer/dist/models/mars/scene.bin",
//   "/mars-viewer/dist/models/mars/textures/texture.jpg",
//   "/mars-viewer/dist/models/mars_desert_research_station/scene.gltf",
//   "/mars-viewer/dist/models/mars_desert_research_station/scene.bin",
//   "/mars-viewer/dist/models/mars_desert_research_station/textures/texture.jpg",
//   "/mars-viewer/dist/models/mars_one_mission_base/scene.gltf",
//   "/mars-viewer/dist/models/mars_one_mission_base/scene.bin",
//   "/mars-viewer/dist/models/mars_one_mission_base/textures/texture.jpg",
//   "/mars-viewer/dist/models/mars_rover/scene.gltf",
//   "/mars-viewer/dist/models/mars_rover/scene.bin",
//   "/mars-viewer/dist/models/mars_rover/textures/texture.jpg",
//   "/mars-viewer/dist/models/marslandscape/scene.gltf",
//   "/mars-viewer/dist/models/marslandscape/scene.bin",
//   "/mars-viewer/dist/models/marslandscape/textures/texture.jpg",
//   "/mars-viewer/dist/models/marster/scene.gltf",
//   "/mars-viewer/dist/models/marster/scene.bin",
//   "/mars-viewer/dist/models/marster/textures/texture.jpg",
//   "/mars-viewer/dist/models/mom_and_kid/scene.gltf",
//   "/mars-viewer/dist/models/mom_and_kid/scene.bin",
//   "/mars-viewer/dist/models/mom_and_kid/textures/texture.jpg",
//   "/mars-viewer/dist/models/scary_alien/scene.gltf",
//   "/mars-viewer/dist/models/scary_alien/scene.bin",
//   "/mars-viewer/dist/models/scary_alien/textures/texture.jpg",
//   "/mars-viewer/dist/models/space_fighter/scene.gltf",
//   "/mars-viewer/dist/models/space_fighter/scene.bin",
//   "/mars-viewer/dist/models/space_fighter/textures/texture.jpg",

//   // Models (mars-viewerr)
//   "/mars-viewerr/models/child/scene.gltf",
//   "/mars-viewerr/models/mars/scene.gltf"
// ];

// // Install event: cache all files and activate immediately
// self.addEventListener("install", event => {
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then(cache => cache.addAll(urlsToCache))
//       .then(() => self.skipWaiting())
//       .catch(error => console.error("Cache open failed:", error))
//   );
// });

// // Activate event: delete old caches and take control of clients
// self.addEventListener("activate", event => {
//   event.waitUntil(
//     caches.keys().then(cacheNames =>
//       Promise.all(
//         cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
//       )
//     ).then(() => self.clients.claim())
//   );
// });

// // Fetch event: serve cached files, fallback to cached pages for navigation requests
// self.addEventListener("fetch", event => {
//   if (event.request.mode === "navigate") {
//     event.respondWith(
//       caches.match(event.request).then(cachedPage => {
//         return cachedPage || caches.match("/index.html");
//       }).catch(() => {
//         return caches.match("/index.html");
//       })
//     );
//     return;
//   }

//   event.respondWith(
//     caches.match(event.request).then(cachedResponse => {
//       if (cachedResponse) {
//         return cachedResponse;
//       }
//       return fetch(event.request).catch(() => {
//         return caches.match("/index.html");
//       });
//     })
//   );
// });

// // Push event: handle incoming push notifications
// self.addEventListener("push", event => {
//   const data = event.data ? event.data.json() : { title: "Marsoverse", body: "Time to explore Mars!" };
//   const options = {
//     body: data.body,
//     icon: "/images/icon-192.png",
//     badge: "/images/icon-192.png",
//     data: {
//       url: data.url || "/index.html" // Default to index.html if no URL is provided
//     }
//   };

//   event.waitUntil(
//     self.registration.showNotification(data.title, options)
//   );
// });

// // Notification click event: open the specified URL
// self.addEventListener("notificationclick", event => {
//   event.notification.close();
//   event.waitUntil(
//     clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
//       const url = event.notification.data.url;
//       for (const client of clientList) {
//         if (client.url === url && "focus" in client) {
//           return client.focus();
//         }
//       }
//       if (clients.openWindow) {
//         return clients.openWindow(url);
//       }
//     })
//   );
// });

// const CACHE_NAME = "marsoverse-cache-v2";

// const urlsToCache = [
//   // Main entry points
//   "/",
//   "/index.html",
//   "/mars.html",
//   "/marzo.html",
//   "/hash.html",
//   "/mini.html",
//   "/zepta.html",
//   "/me.html",
//   "/marxo/marxo.html",
//   "/black/blacko.html",
//   "/poker/poke.html",
//   "/poker/poker.html",
//   "/snake/snake.html",
//   "/space/space.html",

//   // mars-viewerr
//   "/mars-viewerr/index.html",
//   "/mars-viewerr/vite.svg",
//   "/mars-viewerr/models/child/scene.gltf", // example model
//   "/mars-viewerr/models/mars/scene.gltf",  // repeat for all key models
//   "/mars-viewerr/assets/your-asset.png",   // repeat for any asset files

//   // mars-viewer/public/models (example)
//   "/mars-viewer/public/models/2018_nascar_camaro/scene.gltf",
//   "/mars-viewer/public/models/asiannight_city_buildings/scene.gltf",
//   "/mars-viewer/public/models/mars_rover/scene.gltf",

//   // CSS
//   "/styles/main.css",
//   "/styles/hash.css",
//   "/styles/gv.css",
//   "/styles/marzo.css",
//   "/poker/poker.css",
//   "/snake/snake.css",
//   "/space/space.css",

//   // JS
//   "/scripts/main.js",
//   "/scripts/mars.js",
//   "/scripts/marzo.js",
//   "/scripts/zepta.js",
//   "/poker/poker.js",
//   "/snake/snake.js",
//   "/space/space.js",

//   // Sounds (important subset)
//   "/sounds/click.mp3",
//   "/sounds/asteroid.mp3",
//   "/sounds/afterstory.mp3",
//   "/sounds/marsostory.mp3",
//   "/sounds/typing.mp3",
//   "/sounds/intro.mp3",
//   "/sounds/sparkle.mp3",
//   "/sounds/explosion.mp3",
//   "/marsoo.mp4",
//   "/moi.mp4",
//   "/marshuda.mp4",
//   "/marshud.mp4",
//   "/marselsa.mp4",
//   "/marsanna.mp4",
//   "/shacca.mp4",
//   "/starry.mp4",
//   "/elphaba.mp4",
//   "/gaba.mp4",
//   "/giga.mp4",
//   "/astro.mp4",

//   // Images
//   "/images/logo-192by222.png",
//   "/images/logo512by591.png",
//   "/images/icon-192.png",
//   "/images/icon-512.png",
//   "/images/mars-bg.jpg",
//   "/images/title.jpg",

//   "/mars-viewer/public/models/mars_one_mission_base/scene.gltf",
//   "/mars-viewer/public/models/mars_one_mission_base/scene.bin", // if present
//   "/mars-viewer/public/models/mars_one_mission_base/textures/texture.jpg", // replace with actual texture paths

//   // Screens
//   "/screens/snake.png",
//   "/screens/blacko.png",
//   "/screens/marxo.png",
//   "/screens/poke.png",
//   "/screens/spacer.png",

//   // Misc media
//   "/black/black.png",
//   "/poker/pokertable.png",
//   "/Earth Explosion.mp4",
//   "mars_img/insight.jpg",
//   "mars_img/marrr.jpeg",
//   "mars_img/marso.jpeg",
//     "/scripts/hash.js",
//   "/scripts/marzo.js",
//   "/styles/zepta.css",
//   "/styles/hash.css",
//   "/styles/zepta.css",
//   "/images/arrow.png",
//   "/images/wallet.svg",
//   "/images/jeremy.png",
//   "/images/jerry.png",
//   "/images/jeremiah.png",
//   "/images/elena.png",
//   "/images/zara.png",
//   "/images/gee.png",
//   "/images/gia.png",
//   "/images/es.png",
//   "/images/errin.png",
//   "/images/errin1.png",
//   "/images/Screenshot (1542).png",
//   "/images/Screenshot (1543).png",
//   "/images/Screenshot (1544).png",
//   "/images/Screenshot (1545).png",
//   "/images/Screenshot (1546).png",
//   "mars_img/mrove.gif"
// ];


// // Install event: cache files and activate immediately
// self.addEventListener("install", event => {
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then(cache => cache.addAll(urlsToCache))
//       .then(() => self.skipWaiting())
//   );
// });

// // Activate event: delete old caches and take control of clients
// self.addEventListener("activate", event => {
//   event.waitUntil(
//     caches.keys().then(cacheNames =>
//       Promise.all(
//         cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
//       )
//     ).then(() => self.clients.claim())
//   );
// });

// // Fetch event: serve cached files, else fetch from network and cache
// self.addEventListener("fetch", event => {
//   // if (event.request.mode === "navigate") {
//   //   // For navigation requests, try cache first fallback to network
//   //   event.respondWith(
//   //     caches.match("/index.html").then(cachedResponse => {
//   //       return cachedResponse || fetch(event.request);
//   //     })
//   //   );
//   //   return;
//   // }
//   if (event.request.mode === "navigate") {
//   event.respondWith(
//     caches.match(event.request).then(cachedPage => {
//       return cachedPage || caches.match("/index.html") || fetch(event.request);
//     }).catch(() => {
//       return caches.match("/index.html");
//     })
//   );
//   return;
// }


//   event.respondWith(
//     caches.match(event.request).then(cachedResponse => {
//       if (cachedResponse) {
//         return cachedResponse;
//       }

//       return fetch(event.request).then(networkResponse => {
//         if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
//           return networkResponse;
//         }

//         const responseClone = networkResponse.clone();
//         caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
//         return networkResponse;
//       });
//     }).catch(error => {
//       console.error("Fetch failed:", error);
//       // Optional: fallback content for offline here
//     })
//   );
// });
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

