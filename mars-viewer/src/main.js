import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.1;
// controls.minDistance = 1;
// controls.maxDistance = 100;

// controls.enableZoom = true;
// controls.enablePan = true;
// controls.screenSpacePanning = true;

// Remove existing app div content if present
const app = document.getElementById('app');
if (app) app.innerHTML = '';

// Create canvas & add to DOM
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0b0814);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0814);
scene.fog = new THREE.Fog(0x0b0814, 10, 50);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

// Lights
const sunlight = new THREE.DirectionalLight(0xffcc99, 1.5);
sunlight.position.set(5, 10, 7.5);
scene.add(sunlight);

const ambient = new THREE.AmbientLight(0x402010);
scene.add(ambient);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x220000 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Loaders & Controls
const loader = new GLTFLoader();
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.1;
// controls.minDistance = 1.5;
// controls.maxDistance = 20;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

controls.enableZoom = true;
controls.enablePan = true;
controls.screenSpacePanning = true;

// 🌌 ZOOM EXTREMES
controls.minDistance = 0.1;      // Zoom all the way in
controls.maxDistance = 42;     // Zoom all the way out

// 🔄 FULL ORBIT (no angle locks)
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;

let currentModel = null;
let currentView = 'base';

// Models data
// const models = {
//   mars:   { path: './models/mars/scene.gltf', name: 'Mars' },
//   rover:  { path: './models/mars_rover/scene.gltf', name: 'Mars Rover' },
//   base:   { path: './models/mars_one_mission_base/scene.gltf', name: 'Mission Base' },
//   desert: { path: './models/mars_desert_research_station/scene.gltf', name: 'Desert Station' }
// }
const models = {
  // mars:   { path: '/models/marster/scene.glb', name: 'Mars Terrain' },
  // rover:  { path: '/models/mars_rover/scene.gltf', name: 'Mars Rover' },
  base:   { path: './models/mars_one_mission_base/scene.gltf', name: 'Mission Base' },
  // desert: { path: '/models/mars_desert_research_station/scene.gltf', name: 'Desert Station' }
};

async function loadModel(path) {
  console.log(`Loading: ${path}`);
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      path,
      gltf => {
        console.log(`Loaded successfully: ${path}`);
        resolve(gltf.scene);
      },
      undefined,
      error => {
        console.error(`❌ Error loading ${path}:`, error);
        reject(error);
      }
    );
  });
}

// async function showModel(key) {
//   if (currentModel) {
//     scene.remove(currentModel);
//     currentModel.traverse(c => {
//       if (c.isMesh) {
//         c.geometry.dispose();
//         if (c.material.map) c.material.map.dispose();
//         c.material.dispose();
//       }
//     });
//     currentModel = null;
//   }

//   try {
//     const model = await loadModel(models[key].path);
//     currentModel = model;

//     // 🔁 Adjust settings per model
//     switch (key) {
//       case 'rover':
//         currentModel.scale.set(10, 10, 10);
//         currentModel.position.set(0, 0, 0);
//         break;
//       case 'mars':
//         currentModel.scale.set(0.015, 0.015, 0.015);  // High-poly, so scale it small
//         currentModel.position.set(0, -3, 0);          // Sink it slightly if floating
//         break;
//       case 'desert':
//         currentModel.scale.set(2, 2, 2);
//         currentModel.position.set(0, 0, 0);
//         break;
//       case 'base':
//         currentModel.scale.set(1.5, 1.5, 1.5);
//         currentModel.position.set(0, 0, 0);
//         break;
//       default:
//         currentModel.scale.set(1, 1, 1);
//         currentModel.position.set(0, 0, 0);
//     }

//     scene.add(currentModel);
//     controls.reset();
//   } catch (e) {
//     console.error('Model loading error:', e);
//   }
// }

async function showModel(key) {
  if (currentModel) {
    scene.remove(currentModel);
    currentModel.traverse(c => {
      if (c.isMesh) {
        c.geometry.dispose();
        if (c.material.map) c.material.map.dispose();
        c.material.dispose();
      }
    });
    currentModel = null;
  }

  try {
    const model = await loadModel(models[key].path);
    currentModel = model;
    currentModel.position.set(0, 0, 0);
    currentModel.scale.set(1.5, 1.5, 1.5);
    scene.add(currentModel);
    controls.reset();
  } catch (e) {
    console.error('Model loading error:', e);
  }
}

function showMapPlaceholder() {
  if (currentModel) {
    scene.remove(currentModel);
    currentModel.traverse(c => {
      if (c.isMesh) {
        c.geometry.dispose();
        if (c.material.map) c.material.map.dispose();
        c.material.dispose();
      }
    });
    currentModel = null;
  }

  let existing = document.getElementById('map-placeholder');
  if (!existing) {
    const div = document.createElement('div');
    div.id = 'map-placeholder';
    div.style.position = 'absolute';
    div.style.top = '50%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.color = 'white';
    div.style.fontSize = '2rem';
    div.style.fontFamily = "'Orbitron', sans-serif";
    div.style.textAlign = 'center';
    div.style.pointerEvents = 'none';
    div.textContent = 'Map Walkthrough Coming Soon... 🚀';
    document.body.appendChild(div);
  }
}

function removeMapPlaceholder() {
  const existing = document.getElementById('map-placeholder');
  if (existing) existing.remove();
}

// Navbar container & buttons
const navContainer = document.createElement('div');
navContainer.className = 'navbar';  // Use CSS class from your style in index.html

Object.entries(models).forEach(([key, { name }]) => {
  const btn = document.createElement('button');
  btn.textContent = name;
  btn.className = 'nav-item';   // Use CSS class from your style in index.html
  btn.addEventListener('click', () => {
    if (currentView === 'map') removeMapPlaceholder();
    currentView = key;
    showModel(key);
  });
  navContainer.appendChild(btn);
});

// Map tab button
const mapBtn = document.createElement('button');
mapBtn.textContent = 'Map Walkthrough';
mapBtn.className = 'nav-item';   // Use same CSS styling
mapBtn.addEventListener('click', () => {
  if (currentModel) {
    scene.remove(currentModel);
    currentModel.traverse(c => {
      if (c.isMesh) {
        c.geometry.dispose();
        if (c.material.map) c.material.map.dispose();
        c.material.dispose();
      }
    });
    currentModel = null;
  }
  currentView = 'map';
  showMapPlaceholder();
});
navContainer.appendChild(mapBtn);


// Add this at the top of your script or near your globals
let weatherVisible = false;

// Weather Button
const weatherBtn = document.createElement('button');
weatherBtn.textContent = 'Weather Insights';
weatherBtn.className = 'nav-item';
weatherBtn.addEventListener('click', () => {
  weatherVisible = !weatherVisible;
  if (weatherVisible) {
    showWeatherInsights();
    currentView = 'weather';
  } else {
    removeWeatherPanel();
  }
});
navContainer.appendChild(weatherBtn);
document.body.appendChild(navContainer);

// Show Weather Panel
async function showWeatherInsights() {
  if (document.getElementById('weather-container')) return;

  const key = 'DEMO_KEY'; // Replace with real key
  const proxy = "https://corsproxy.io/?";
  const url = `${proxy}https://api.nasa.gov/insight_weather/?api_key=${key}&feedtype=json&ver=1.0`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const solKeys = data.sol_keys || [];

    const container = document.createElement('div');
    container.id = 'weather-container';
    container.style = `
      position: fixed;
      top: 10px;
      left: 10px;
      bottom: 10px;
      overflow-y: auto;
      color: white;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.7);
      max-width: 320px;
      font-family: 'Orbitron', monospace;
      z-index: 1;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
    `;
    container.innerHTML = '<h2>Mars Weather Insights</h2>';

    solKeys.forEach(sol => {
      const r = data[sol];
      container.innerHTML += `
        <div style="margin-bottom:1rem;">
          <strong>Sol ${sol}</strong><br/>
          Temp Avg: ${r.AT?.av?.toFixed(1)}°C, High: ${r.AT?.mx?.toFixed(1)}°C<br/>
          Wind Avg: ${r.HWS?.av?.toFixed(2)} m/s<br/>
          Pressure Avg: ${r.PRE?.av?.toFixed(1)} Pa<br/>
          Season: ${r.Season}<br/>
        </div>`;
    });

    document.body.appendChild(container);
  } catch (e) {
    console.error('Weather fetch failed:', e);
  }
}

// Remove Weather Panel
function removeWeatherPanel() {
  const container = document.getElementById('weather-container');
  if (container) container.remove();
}

// // Create Weather Tab button
// const weatherBtn = document.createElement('button');
// weatherBtn.textContent = 'Weather Insights';
// weatherBtn.className = 'nav-item';
// weatherBtn.addEventListener('click', () => {
//   showWeatherInsights();

//   currentView = 'weather';
// });
// navContainer.appendChild(weatherBtn);

// document.body.appendChild(navContainer);

// async function showWeatherInsights() {
//   console.log("Weather button clicked ✅");
//   clearScene(); // remove models & placeholders
//   const key = 'DEMO_KEY'; // use your real key in production
//   const proxy = "https://corsproxy.io/?";
//   const url = `${proxy}https://api.nasa.gov/insight_weather/?api_key=${key}&feedtype=json&ver=1.0`;


//   try {
//     const res = await fetch(url);
//     const data = await res.json();
//     const solKeys = data.sol_keys || [];

//     const container = document.getElementById('weather-container') || document.createElement('div');
//     container.id = 'weather-container';
//     container.style = `
//   position: fixed;
//   top: 10px;
//   left: 10px;
//   right: auto;
//   bottom: 10px;
//   overflow-y: auto;
//   color: white;
//   padding: 1rem;
//   background: rgba(0, 0, 0, 0.7);
//   max-width: 320px;
//   font-family: 'Orbitron', monospace;
//   z-index: 1;
//   border-radius: 8px;
//   box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
// `;
// container.innerHTML = '<h2>Mars Weather Insights</h2>';

//     solKeys.forEach(sol => {
//       const r = data[sol];
//       container.innerHTML += `
//         <div style="margin-bottom:1rem;">
//           <strong>Sol ${sol}</strong><br/>
//           Temp Avg: ${r.AT?.av?.toFixed(1)}°C, High: ${r.AT?.mx?.toFixed(1)}°C<br/>
//           Wind Avg: ${r.HWS?.av?.toFixed(2)} m/s<br/>
//           Pressure Avg: ${r.PRE?.av?.toFixed(1)} Pa<br/>
//           Season: ${r.Season}<br/>
//         </div>`;
//         console.log("Fetched data:", data);

//     });

//     document.body.appendChild(container);
//   } catch (e) {
//     console.error('Weather fetch failed:', e);
//   }
// }

// function clearScene() {
//   if (currentModel) {
//     scene.remove(currentModel);
//     currentModel.traverse(c => {
//       if (c.isMesh) {
//         c.geometry.dispose();
//         if (c.material.map) c.material.map.dispose();
//         c.material.dispose();
//       }
//     });
//     currentModel = null;
//   }

//   const old = document.getElementById('map-placeholder');
//   if (old) old.remove();

//   const weather = document.getElementById('weather-container');
//   if (weather) weather.remove();
// }

let galleryVisible = false;

// Photo Gallery Button
const galleryBtn = document.createElement('button');
galleryBtn.textContent = 'Photo Gallery';
galleryBtn.className = 'nav-item';
galleryBtn.addEventListener('click', () => {
  galleryVisible = !galleryVisible;
  if (galleryVisible) {
    showPhotoGallery();
    currentView = 'gallery';
  } else {
    removeGallery();
  }
});
navContainer.appendChild(galleryBtn);

// Function to show photo gallery
async function showPhotoGallery() {
  if (document.getElementById('gallery-container')) return;

  const key = 'DEMO_KEY';
  const sol = 1000;
  const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=${sol}&api_key=${key}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const photos = [...new Map(data.photos.map(p => [p.img_src, p])).values()].slice(0, 10); // get unique & limit to 10

    const container = document.createElement('div');
    container.id = 'gallery-container';
    container.style = `
      position: fixed;
      top: 10px;
      right: 10px;
      bottom: 10px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.75);
      color: white;
      padding: 1rem;
      max-width: 340px;
      font-family: 'Orbitron', monospace;
      z-index: 1;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(255,255,255,0.2);
    `;

    container.innerHTML = `<h2>Mars Rover Gallery</h2>`;

    photos.forEach(photo => {
      const thumb = document.createElement('img');
      thumb.src = photo.img_src;
      thumb.alt = "Mars Rover";
      thumb.style = "width: 100%; border-radius: 4px; cursor: pointer; margin-bottom: 0.5rem;";
      thumb.addEventListener('click', () => openImageModal(photo.img_src, photo.earth_date, photo.camera.full_name));
      container.appendChild(thumb);
    });

    document.body.appendChild(container);
  } catch (e) {
    console.error("Gallery fetch failed:", e);
  }
}

function removeGallery() {
  const container = document.getElementById('gallery-container');
  if (container) container.remove();
  removeImageModal();
}

// Modal Functions
function openImageModal(src, date, camera) {
  removeImageModal(); // in case one already exists

  const modal = document.createElement('div');
  modal.id = 'image-modal';
  modal.style = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.9);
    z-index: 999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: Orbitron, monospace;
  `;

  const closeBtn = document.createElement('div');
  closeBtn.textContent = '✖';
  closeBtn.style = `
    position: absolute;
    top: 20px;
    right: 30px;
    font-size: 2rem;
    color: white;
    cursor: pointer;
  `;
  closeBtn.addEventListener('click', removeImageModal);

  const img = document.createElement('img');
  img.src = src;
  img.style = `
    max-width: 90%;
    max-height: 80vh;
    border-radius: 12px;
    box-shadow: 0 0 15px rgba(255,255,255,0.3);
  `;

  const caption = document.createElement('div');
  caption.textContent = `📅 ${date} | 📷 ${camera}`;
  caption.style = "color: white; margin-top: 1rem; font-size: 1rem;";

  modal.appendChild(closeBtn);
  modal.appendChild(img);
  modal.appendChild(caption);
  document.body.appendChild(modal);
}

function removeImageModal() {
  const modal = document.getElementById('image-modal');
  if (modal) modal.remove();
}

// Global toggle to track if gallery is visible
// let galleryVisible = false;

// // Create the Photo Gallery Nav button
// const galleryBtn = document.createElement('button');
// galleryBtn.textContent = 'Photo Gallery';
// galleryBtn.className = 'nav-item';
// galleryBtn.addEventListener('click', () => {
//   galleryVisible = !galleryVisible;
//   if (galleryVisible) {
//     showPhotoGallery();
//     currentView = 'gallery';
//   } else {
//     removeGallery();
//   }
// });
// navContainer.appendChild(galleryBtn);

// async function showPhotoGallery() {
//   if (document.getElementById('gallery-container')) return;

//   const key = 'DEMO_KEY'; // Use your real key later
//   const sol = 1000;
//   const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=${sol}&api_key=${key}`;

//   try {
//     const res = await fetch(url);
//     const data = await res.json();
//     const photos = data.photos.slice(0, 12); // Limit to 12 for speed

//     const container = document.createElement('div');
//     container.id = 'gallery-container';
//     container.style = `
//       position: fixed;
//       top: 10px;
//       right: 10px;
//       bottom: 10px;
//       overflow-y: auto;
//       background: rgba(0, 0, 0, 0.75);
//       color: white;
//       padding: 1rem;
//       max-width: 340px;
//       font-family: 'Orbitron', monospace;
//       z-index: 1;
//       border-radius: 8px;
//       box-shadow: 0 0 10px rgba(255,255,255,0.2);
//     `;

//     container.innerHTML = `<h2>Mars Rover Gallery</h2>`;

//     photos.forEach(photo => {
//       container.innerHTML += `
//         <div style="margin-bottom: 1rem;">
//           <img src="${photo.img_src}" alt="Rover Photo" style="width:100%; border-radius: 4px;" />
//           <div style="font-size: 0.75rem; margin-top: 0.3rem;">
//             📅 ${photo.earth_date} | 📷 ${photo.camera.full_name}
//           </div>
//         </div>`;
//     });

//     document.body.appendChild(container);
//   } catch (e) {
//     console.error("Failed to load gallery:", e);
//   }
// }

// function removeGallery() {
//   const container = document.getElementById('gallery-container');
//   if (container) container.remove();
// }
// --- Mars 360 Setup ---

// 1. Add Mars 360 Button to Navbar
const mars360Btn = document.createElement('button');
mars360Btn.textContent = 'Mars 360';
mars360Btn.className = 'nav-item';
mars360Btn.addEventListener('click', () => {
  toggleMars360(true);
});
navContainer.appendChild(mars360Btn);

// 2. Create Modal Container
const mars360Modal = document.createElement('div');
mars360Modal.id = 'mars360Modal';
mars360Modal.style.cssText = `
  display: none;
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: black;
  z-index: 1000;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

// 3. Video Element
const mars360Video = document.createElement('video');
mars360Video.controls = true;
mars360Video.loop = true;
mars360Video.muted = true;
mars360Video.style.cssText = `
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: auto;
`;

// 4. Close Button
const closeBtn = document.createElement('button');
closeBtn.textContent = '✖';
closeBtn.style.cssText = `
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  z-index: 1001;
  background: rgba(0,0,0,0.7);
  color: white;
  border: none;
  cursor: pointer;
  pointer-events: auto;
`;
closeBtn.onclick = () => toggleMars360(false);

// 5. Control Buttons
const controlBar = document.createElement('div');
controlBar.style.cssText = `
  position: absolute;
  bottom: 20px;
  display: flex;
  gap: 10px;
  z-index: 1001;
  pointer-events: auto;
`;

['a', 'b'].forEach(id => {
  const btn = document.createElement('button');
  btn.textContent = `Video ${id.toUpperCase()}`;
  btn.style.cssText = `
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.1);
    color: white;
    border: 1px solid white;
    cursor: pointer;
  `;
  btn.onclick = () => playMars360(id);
  controlBar.appendChild(btn);
});

// 6. Append Everything
mars360Modal.appendChild(mars360Video);
mars360Modal.appendChild(closeBtn);
mars360Modal.appendChild(controlBar);
document.body.appendChild(mars360Modal);

// 7. Toggle Modal
function toggleMars360(show) {
  mars360Modal.style.display = show ? 'flex' : 'none';
  if (show) playMars360('a');
  else {
    mars360Video.pause();
    mars360Video.src = '';
  }
}

// 8. Play Selected Video
function playMars360(id) {
  mars360Video.src = `./videos/mars360${id}.webm`;
  mars360Video.play().catch(console.error);
}



function animate() {
  requestAnimationFrame(animate);

  if (currentModel) {
    currentModel.rotation.y += 0.003;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener("DOMContentLoaded", () => {
  const marsTheme = document.getElementById("marsTheme");
  if (marsTheme) {
    marsTheme.play().catch(err => {
      console.warn("Autoplay might be blocked:", err);
    });
  }
});


// Load initial model
showModel('base');

