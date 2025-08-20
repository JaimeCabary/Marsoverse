import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// Remove existing app div content if present
const app = document.getElementById('app');
if (app) app.innerHTML = '';

// Create canvas & add to DOM
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const defaultCameraPos = new THREE.Vector3(0, 8, 15);
const defaultTarget = new THREE.Vector3(0, 2, 0);


// Renderer setup with Mars atmosphere
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xcc5522, 0.1); // Mars color fallback
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2; // Slightly brighter for Mars sun
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

const scene = new THREE.Scene();

// Load HDR Environment for Mars atmosphere
const rgbeLoader = new RGBELoader();
rgbeLoader.load('./MR_INT-001_NaturalStudio_NAD.hdr', function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
    console.log('HDR Mars environment loaded successfully ✅');
}, undefined, function(error) {
    console.warn('HDR file not found, using fallback Mars sky');
    // Fallback Mars sky gradient
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Create Mars sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#dc7f33ff'); // Mars sunset orange
    gradient.addColorStop(0.3, '#cc6633');
    gradient.addColorStop(0.7, '#ab321fff');
    gradient.addColorStop(1, '#2d1810');   // Dark Mars horizon
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
});

// Camera with better positioning
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Mars-like lighting setup
const marsLight = new THREE.DirectionalLight(0xffaa66, 1.8); // Mars orange sunlight
marsLight.position.set(20, 30, 15);
marsLight.castShadow = true;
marsLight.shadow.mapSize.width = 2048;
marsLight.shadow.mapSize.height = 2048;
marsLight.shadow.camera.near = 0.5;
marsLight.shadow.camera.far = 100;
marsLight.shadow.camera.left = -50;
marsLight.shadow.camera.right = 50;
marsLight.shadow.camera.top = 50;
marsLight.shadow.camera.bottom = -50;
scene.add(marsLight);

// Softer ambient for Mars atmosphere
const marsAmbient = new THREE.AmbientLight(0x664433, 0.3); // Warm Mars ambient
scene.add(marsAmbient);

// Additional rim light for atmosphere
const rimLight = new THREE.DirectionalLight(0xff6633, 0.5);
rimLight.position.set(-20, 10, -15);
scene.add(rimLight);

// Enhanced Mars terrain
const marsGround = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200, 50, 50),
  new THREE.MeshStandardMaterial({ 
    color: 0xf8e4b0,         // Base Mars-orange color
    transparent: true,       // Enable transparency
    opacity: 0.3,            // Light + soft (tweak this!)
    roughness: 0.9,
    metalness: 0.02,
    bumpScale: 0.1,
    depthWrite: false        // Avoid z-fighting if your model sits on it
  })
);
marsGround.rotation.x = -Math.PI / 2;
marsGround.receiveShadow = true;

// Add some vertex displacement for terrain variation
const vertices = marsGround.geometry.attributes.position.array;
for (let i = 0; i < vertices.length; i += 3) {
  vertices[i + 2] += Math.random() * 0.5 - 0.25; // Random height variation
}
marsGround.geometry.attributes.position.needsUpdate = true;
marsGround.geometry.computeVertexNormals();

scene.add(marsGround);

// Enhanced controls for flying/walking experience
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = true;
controls.screenSpacePanning = false;

// Flying to walking ranges
controls.minDistance = 0.5;    // Close walking view
controls.maxDistance = 100;    // High flying view

// Full rotation freedom
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;

// Enhanced pan limits for ground-level exploration
controls.maxPolarAngle = Math.PI;
controls.minAzimuthAngle = -Infinity;
controls.maxAzimuthAngle = Infinity;

// Add WASD movement
const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
const moveSpeed = 0.1;

document.addEventListener('keydown', (e) => {
  switch(e.code) {
    case 'KeyW': keys.w = true; break;
    case 'KeyA': keys.a = true; break;
    case 'KeyS': keys.s = true; break;
    case 'KeyD': keys.d = true; break;
    case 'ShiftLeft': keys.shift = true; break;
    case 'Space': keys.space = true; e.preventDefault(); break;
  }
});

document.addEventListener('keyup', (e) => {
  switch(e.code) {
    case 'KeyW': keys.w = false; break;
    case 'KeyA': keys.a = false; break;
    case 'KeyS': keys.s = false; break;
    case 'KeyD': keys.d = false; break;
    case 'ShiftLeft': keys.shift = false; break;
    case 'Space': keys.space = false; break;
  }
});

function handleMovement() {
  const speed = keys.shift ? moveSpeed * 3 : moveSpeed;
  
  if (keys.w) controls.object.translateZ(-speed);
  if (keys.s) controls.object.translateZ(speed);
  if (keys.a) controls.object.translateX(-speed);
  if (keys.d) controls.object.translateX(speed);
  if (keys.space) controls.object.translateY(speed);
}

let currentModel = null;
let currentView = 'base';

const models = {
  base: { path: './models/mars_one_mission_base/scene.gltf', name: 'Mission Base' },
};

const loader = new GLTFLoader();

async function loadModel(path) {
  console.log(`Loading: ${path}`);
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      gltf => {
        console.log(`Loaded successfully: ${path}`);
        // Enable shadows on model
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
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
    if (key === 'base') {
    camera.position.copy(defaultCameraPos);
    controls.target.copy(defaultTarget);
    controls.update();
  }


  try {
    const model = await loadModel(models[key].path);
    currentModel = model;
    currentModel.position.set(0, 0, 0);
    currentModel.scale.set(2, 2, 2);
    scene.add(currentModel);
    controls.reset();
    
    // Set camera for better initial view
    camera.position.set(0, 8, 15);
    controls.target.set(0, 2, 0);
    controls.update();
  } catch (e) {
    console.error('Model loading error:', e);
  }
}

// HUD Creation
function createHUD() {
  const hud = document.createElement('div');
  hud.id = 'mars-hud';
  hud.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(90deg, rgba(115, 41, 1, 0.9), rgba(80, 0, 0, 0.9), rgba(28, 25, 125, 0.9));
    backdrop-filter: blur(10px);
    border-bottom: 2px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    z-index: 100;
    font-family: 'Orbitron', sans-serif;
    color: white;
    height: 60px; /* Default height for desktop */
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    padding-top: calc(8px + env(safe-area-inset-top));
    @media (max-width: 600px) {
      flex-direction: column;
      height: auto;
      padding: 10px;
      justify-content: center;
      gap: 8px; /* Space between stacked elements */
      padding-top: calc(8px + env(safe-area-inset-top));
    }
  `;

  // Back button
  const backBtn = document.createElement('button');
  backBtn.innerHTML = '← Back';
  backBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    cursor: pointer;
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(0.7rem, 2.5vw, 0.8rem); /* Responsive font size */
    transition: all 0.3s ease;
    @media (max-width: 600px) {
      padding: 5px 10px;
      font-size: clamp(0.6rem, 2.5vw, 0.7rem);
    }
  `;
  backBtn.onmouseover = () => (backBtn.style.background = 'rgba(255, 255, 255, 0.2)');
  backBtn.onmouseout = () => (backBtn.style.background = 'rgba(255, 255, 255, 0.1)');
backBtn.onclick = () => {
  window.history.back(); // Let browser handle navigation
};


  // Player name display
  const playerName = localStorage.getItem('playerName') || 'Space Explorer';
  const nameDisplay = document.createElement('div');
  nameDisplay.style.cssText = `
    font-size: clamp(0.7rem, 2.5vw, 0.8rem);
    font-weight: bold;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    white-space: nowrap; /* Prevent wrapping */
    @media (max-width: 600px) {
      font-size: clamp(0.6rem, 2.5vw, 0.7rem);
    }
  `;
  nameDisplay.textContent = `👨‍🚀 ${playerName}`;

  // Controls info
  const controlsInfo = document.createElement('div');
  controlsInfo.style.cssText = `
    font-size: clamp(0.7rem, 2.5vw, 0.8rem);
    opacity: 0.8;
    text-align: right;
    white-space: nowrap;
    @media (max-width: 600px) {
      font-size: clamp(0.6rem, 2.5vw, 0.7rem);
      text-align: center;
    }
  `;
  // Simplify controls text for mobile
  controlsInfo.innerHTML = window.innerWidth <= 600 ? 'WASD: Move | Touch: Look' : 'WASD: Move | Mouse: Look<br>Shift: Speed | Space: Up';

  // Sound toggle button
const marsTheme = document.getElementById('marsTheme');
const soundBtn = document.createElement('button');

// Always show volume-up icon on load
soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';

soundBtn.style.cssText = `
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 10px;
  border-radius: 20px;
  cursor: pointer;
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(0.7rem, 2.5vw, 0.8rem);
  transition: all 0.3s ease;
  margin-left: 10px;
`;

// Handle hover effects
soundBtn.onmouseover = () => {
  soundBtn.style.background = 'rgba(255, 255, 255, 0.2)';
};
soundBtn.onmouseout = () => {
  soundBtn.style.background = 'rgba(255, 255, 255, 0.1)';
};

// Toggle sound on click
soundBtn.onclick = () => {
  if (marsTheme) {
    if (marsTheme.paused) {
      marsTheme.play().catch(err => console.warn('Audio playback failed:', err));
      soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
      marsTheme.pause();
      soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  }
};

  hud.appendChild(backBtn);
  hud.appendChild(nameDisplay);
  hud.appendChild(controlsInfo);
  hud.appendChild(soundBtn);
  document.body.appendChild(hud);

  // Adjust HUD height dynamically for mobile
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 600) {
      hud.style.height = 'auto';
      controlsInfo.innerHTML = 'WASD: Move | Touch: Look';
    } else {
      hud.style.height = '60px';
      controlsInfo.innerHTML = 'WASD: Move | Mouse: Look<br>Shift: Speed | Space: Up';
    }
  });
}

// Enhanced Navbar with FA Icons
function createNavbar() {
  // Add Font Awesome
  const faLink = document.createElement('link');
  faLink.rel = 'stylesheet';
  faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
  document.head.appendChild(faLink);

  const navContainer = document.createElement('div');
  navContainer.className = 'navbar';
  navContainer.style.cssText = `
    position: fixed;
    bottom: 0;
    width: 100%;
    background: linear-gradient(90deg, rgba(115, 41, 1, 0.95), rgba(80, 0, 0, 0.95), rgba(28, 25, 125, 0.95));
    backdrop-filter: blur(15px);
    border-top: 2px solid rgba(255, 255, 255, 0.3);
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 10px 5px calc(10px + env(safe-area-inset-bottom)) 5px;
    z-index: 1000;
    font-family: 'Orbitron', sans-serif;
    box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.3);
    @media (max-width: 600px) {
    padding: 5px 3px calc(5px + env(safe-area-inset-bottom)) 3px;
    font-size: clamp(0.6rem, 2vw, 0.7rem);
  `;
// const navContainer = document.createElement('div');
// navContainer.className = 'navbar';  // Use CSS class from your style in index.html

// Object.entries(models).forEach(([key, { name }]) => {
//   const btn = document.createElement('button');
//   btn.textContent = name;
//   btn.className = 'nav-item';   // Use CSS class from your style in index.html
//   btn.addEventListener('click', () => {
//     if (currentView === 'map') removeMapPlaceholder();
//     currentView = key;
//     showModel(key);
//   });
//   navContainer.appendChild(btn);
// });

  const navItems = [
    { key: 'base', icon: 'fas fa-building', text: 'Base', action: () => showModel('base') },
    { key: 'weather', icon: 'fas fa-cloud-sun', text: 'Weather', action: toggleWeather },
    { key: 'gallery', icon: 'fas fa-images', text: 'Gallery', action: toggleGallery },
    { key: 'mars360', icon: 'fas fa-globe', text: 'M360', action: () => window.open('/mars-rpg.html', '_blank') },
    { key: 'map', icon: 'fas fa-map', text: 'Map', action: showMapPlaceholder }
  ];

  navItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.innerHTML = `
      <i class="${item.icon}" style="font-size: 0.7rem; margin-bottom: 4px;"></i>
      <div style="font-size: 0.5rem;">${item.text}</div>
    `;
    btn.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      color: white;
      padding: 4px 5px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 40px;
      font-family: 'Orbitron', sans-serif;
      @media (max-width: 600px) {
      padding: 8px 6px;
      min-width: 50px;
      height: 50px;
      font-size: clamp(0.6rem, 2vw, 0.7rem);
    `;
    
    btn.onmouseover = () => {
      btn.style.background = 'rgba(255, 255, 255, 0.2)';
      btn.style.transform = 'translateY(-2px)';
    };
    btn.onmouseout = () => {
      btn.style.background = 'rgba(255, 255, 255, 0.1)';
      btn.style.transform = 'translateY(0)';
    };
    
   // Correct click handler
  btn.addEventListener('click', () => {
    if (currentView === 'map') removeMapPlaceholder();
    currentView = item.key;
    item.action();
  });

  navContainer.appendChild(btn);
});

  document.body.appendChild(navContainer);
}

function createVirtualJoystick() {
  const joystickContainer = document.createElement('div');
  joystickContainer.id = 'joystick-container';
  joystickContainer.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 20px;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    z-index: 1001;
    display: none;
    touch-action: none;
    pointer-events: auto;
  `;
  const joystickKnob = document.createElement('div');
  joystickKnob.style.cssText = `
    position: absolute;
    width: 50px;
    height: 50px;
    background: rgba(255, 100, 0, 0.8);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  `;
  joystickContainer.appendChild(joystickKnob);
  document.body.appendChild(joystickContainer);
  if (window.innerWidth <= 768 || 'ontouchstart' in window) {
    joystickContainer.style.display = 'block';
  }
  let joystickActive = false;
  let joystickCenterX, joystickCenterY;
  let knobX = 0, knobY = 0;
  joystickContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    const rect = joystickContainer.getBoundingClientRect();
    joystickCenterX = rect.left + rect.width / 2;
    joystickCenterY = rect.top + rect.height / 2;
  });
  joystickContainer.addEventListener('touchmove', (e) => {
    if (!joystickActive) return;
    const touch = e.touches[0];
    let dx = touch.clientX - joystickCenterX;
    let dy = touch.clientY - joystickCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50;
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    knobX = dx;
    knobY = dy;
    joystickKnob.style.transform = `translate(${dx - 25}px, ${dy - 25}px)`;
    keys.w = dy < -20;
    keys.s = dy > 20;
    keys.a = dx < -20;
    keys.d = dx > 20;
    keys.shift = distance > 40;
  });
  joystickContainer.addEventListener('touchend', () => {
    joystickActive = false;
    knobX = 0;
    knobY = 0;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
    keys.w = false;
    keys.s = false;
    keys.a = false;
    keys.d = false;
    keys.shift = false;
  });
}
createVirtualJoystick();

// Weather toggle functionality - YOUR ORIGINAL WORKING VERSION
let weatherVisible = false;
function toggleWeather() {
  weatherVisible = !weatherVisible;
  if (weatherVisible) {
    showWeatherInsights();
    currentView = 'weather';
  } else {
    removeWeatherPanel();
  }
}

// Show Weather Panel - YOUR ORIGINAL NASA API CODE
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
      top: 70px;
      left: 10px;
      bottom: 90px;
      overflow-y: auto;
      color: white;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.8);
      max-width: 320px;
      font-family: 'Orbitron', monospace;
      z-index: 50;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
    `;
    container.innerHTML = '<h2><i class="fas fa-thermometer-half"></i> Mars Weather Insights</h2>';

    solKeys.forEach(sol => {
      const r = data[sol];
      container.innerHTML += `
        <div style="margin-bottom:1rem;">
          <strong>Sol ${sol}</strong><br/>
          Temp Avg: ${r.AT?.av?.toFixed(1)}°C, High: ${r.AT?.mx?.toFixed(1)}°C<br/>
          Wind Avg: ${r.HWS?.av?.toFixed(2)} m/s<br/>
          Pressure Avg: ${r.PRE?.av?.toFixed(1)} Pa<br/>
          Season: ${r.Season}<br/>
        </div>`;
    });

    document.body.appendChild(container);
  } catch (e) {
    console.error('Weather fetch failed:', e);
    // Fallback content if API fails
    container.innerHTML = `
      <h2><i class="fas fa-thermometer-half"></i> Mars Weather</h2>
      <div style="margin: 1rem 0;">
        <strong>Sol 3847</strong><br/>
        🌡️ Temp: -63°C (High: -23°C)<br/>
        💨 Wind: 5.2 m/s<br/>
        📊 Pressure: 745 Pa<br/>
        🗓️ Season: Late Spring<br/>
      </div>`;
    document.body.appendChild(container);
  }
}

// Remove Weather Panel
function removeWeatherPanel() {
  const container = document.getElementById('weather-container');
  if (container) container.remove();
}

// Gallery toggle functionality - YOUR ORIGINAL WORKING VERSION
let galleryVisible = false;
function toggleGallery() {
  galleryVisible = !galleryVisible;
  if (galleryVisible) {
    showPhotoGallery();
    currentView = 'gallery';
  } else {
    removeGallery();
  }
}

// Function to show photo gallery - YOUR ORIGINAL NASA API CODE
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
      top: 70px;
      right: 10px;
      bottom: 90px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 1rem;
      max-width: 340px;
      font-family: 'Orbitron', monospace;
      z-index: 50;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
    `;

    container.innerHTML = `<h2><i class="fas fa-camera"></i> Mars Rover Gallery</h2>`;

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
    // Fallback content if API fails
    container.innerHTML = `
      <h2><i class="fas fa-camera"></i> Mars Gallery</h2>
      <div style="margin: 1rem 0;">
        <img src="https://mars.nasa.gov/system/news_items/main_images/8813_PIA24869-1600.jpg" 
             style="width: 100%; border-radius: 8px; margin-bottom: 10px;" alt="Mars surface">
        <div style="font-size: 0.8rem; opacity: 0.8;">Perseverance Sol 467 • Mastcam-Z</div>
      </div>
    `;
    document.body.appendChild(container);
  }
}

function removeGallery() {
  const container = document.getElementById('gallery-container');
  if (container) container.remove();
  removeImageModal();
}

// Modal Functions - YOUR ORIGINAL WORKING VERSION
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

function showMapPlaceholder() {
  // Remove other panels
  removeWeatherPanel();
  removeGallery();
  
  let existing = document.getElementById('map-placeholder');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'map-placeholder';
  div.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 2rem;
    font-family: 'Orbitron', sans-serif;
    text-align: center;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.7);
    padding: 2rem;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
  `;
  div.innerHTML = `
    <i class="fas fa-map" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
    Map Walkthrough Coming Soon... 🚀
  `;
  document.body.appendChild(div);
}

function removeMapPlaceholder() {
  const existing = document.getElementById('map-placeholder');
  if (existing) existing.remove();
}

// Mars 360 Setup
const mars360Modal = document.createElement('div');
mars360Modal.id = 'mars360Modal';
mars360Modal.style.cssText = `
  display: none;
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: black;
  z-index: 1000;
  overflow: hidden;
`;

const viewport = document.createElement('div');
viewport.id = 'viewport';
viewport.style.cssText = `
  position: absolute;
  width: 200%;
  height: 200%;
  overflow: hidden;
  cursor: grab;
`;

const videoContainer = document.createElement('div');
videoContainer.id = 'videoContainer';
videoContainer.style.cssText = `
  position: absolute;
  width: 100%;
  height: 100%;
  transform-origin: center center;
  will-change: transform;
`;

const mars360Video = document.createElement('video');
mars360Video.controls = false;
mars360Video.loop = true;
mars360Video.muted = true;
mars360Video.setAttribute('playsinline', '');
mars360Video.style.cssText = `
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const mars360CloseBtn = document.createElement('button');
mars360CloseBtn.innerHTML = '<i class="fas fa-times"></i>';
mars360CloseBtn.style.cssText = `
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 15px;
  font-size: 1.5rem;
  z-index: 1001;
  background: rgba(0,0,0,0.7);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
`;
mars360CloseBtn.onclick = () => toggleMars360(false);

videoContainer.appendChild(mars360Video);
viewport.appendChild(videoContainer);
mars360Modal.appendChild(viewport);
mars360Modal.appendChild(mars360CloseBtn);
document.body.appendChild(mars360Modal);

// 360 Control Variables
let isDragging = false;
let startX, startY;
let panX = 0, panY = 0;
let scale = 1;

// Update toggleMars360 function for better video handling
function toggleMars360(show) {
  
  mars360Modal.style.display = show ? 'flex' : 'none';
  if (show) {
    // Primary local video source
    const primarySource = './videos/mars360a.webm';
    // Fallback online video source (public domain or your hosted video)
    const fallbackSource = 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/00001/ids/edr/files/360pano.mp4';
    
    mars360Video.src = primarySource;
    mars360Video.load();
    mars360Video.play().catch((error) => {
      console.warn('Primary 360 video failed:', error);
      // Try fallback source
      mars360Video.src = fallbackSource;
      mars360Video.load();
      mars360Video.play().catch((err) => {
        console.warn('Fallback 360 video failed, using placeholder:', err);
        mars360Video.style.background = 'ur[](https://mars.nasa.gov/system/news_items/main_images/8813_PIA24869-1600.jpg) center/cover';
      });
    });
    panX = 0; panY = 0; scale = 1;
    updateView();
  } else {
    mars360Video.pause();
    mars360Video.src = '';
    mars360Video.style.background = ''; // Clear placeholder
  }
}

function updateView() {
  videoContainer.style.transform = `translate(${-panX}px, ${-panY}px) scale(${scale})`;
  viewport.style.left = `calc(50% + ${panX}px)`;
  viewport.style.top = `calc(50% + ${panY}px)`;
}
// Touch controls for 360 video
let lastTouchX, lastTouchY;
let pinchStartDistance = 0;

viewport.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevent default scrolling
  if (e.touches.length === 1) {
    isDragging = true;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    // Pinch zoom
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchStartDistance = Math.sqrt(dx * dx + dy * dy);
  }
});

viewport.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1 && isDragging) {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    panX += (lastTouchX - touchX) * 0.5; // Adjust sensitivity
    panY += (lastTouchY - touchY) * 0.5;
    lastTouchX = touchX;
    lastTouchY = touchY;
    updateView();
  } else if (e.touches.length === 2) {
    // Pinch zoom
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (pinchStartDistance > 0) {
      const scaleChange = distance / pinchStartDistance;
      scale = Math.max(0.5, Math.min(scale * scaleChange, 3)); // Limit zoom
      pinchStartDistance = distance;
      updateView();
    }
  }
});

viewport.addEventListener('touchend', () => {
  isDragging = false;
  pinchStartDistance = 0;
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  handleMovement();
  
  if (currentModel && !keys.w && !keys.a && !keys.s && !keys.d) {
    currentModel.rotation.y += 0.002;
  }

  controls.update();
  renderer.render(scene, camera);
}

// Window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


// Initialize everything
createHUD();
createNavbar();
showModel('base');

// Get the audio element
const marsTheme = document.getElementById("marsTheme");
if (marsTheme) {
  marsTheme.loop = true; // Ensure looping is enabled
  marsTheme.volume = 0.5; // Set a moderate volume (adjust as needed)
  marsTheme.play().catch(err => {
    console.warn("Autoplay blocked. Please interact with the page to enable audio:", err);
  });
} else {
  console.warn("Audio element with id 'marsTheme' not found in the DOM.");
}
animate();

console.log('Mars Viewer initialized! 🚀');
console.log('Controls: WASD to move, mouse to look around, Shift for speed boost');




// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// // const controls = new OrbitControls(camera, renderer.domElement);
// // controls.enableDamping = true;
// // controls.dampingFactor = 0.1;
// // controls.minDistance = 1;
// // controls.maxDistance = 100;

// // controls.enableZoom = true;
// // controls.enablePan = true;
// // controls.screenSpacePanning = true;

// // Remove existing app div content if present
// const app = document.getElementById('app');
// if (app) app.innerHTML = '';

// // Create canvas & add to DOM
// const canvas = document.createElement('canvas');
// document.body.appendChild(canvas);

// // Renderer setup
// const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setClearColor(0x0b0814);

// const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x0b0814);
// scene.fog = new THREE.Fog(0x0b0814, 10, 50);

// // Camera
// const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(0, 2, 5);

// // Lights
// const sunlight = new THREE.DirectionalLight(0xffcc99, 1.5);
// sunlight.position.set(5, 10, 7.5);
// scene.add(sunlight);

// const ambient = new THREE.AmbientLight(0x402010);
// scene.add(ambient);

// // Ground
// const ground = new THREE.Mesh(
//   new THREE.PlaneGeometry(100, 100),
//   new THREE.MeshStandardMaterial({ color: 0x220000 })
// );
// ground.rotation.x = -Math.PI / 2;
// scene.add(ground);

// // Loaders & Controls
// const loader = new GLTFLoader();
// // const controls = new OrbitControls(camera, renderer.domElement);
// // controls.enableDamping = true;
// // controls.dampingFactor = 0.1;
// // controls.minDistance = 1.5;
// // controls.maxDistance = 20;
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.1;

// controls.enableZoom = true;
// controls.enablePan = true;
// controls.screenSpacePanning = true;

// // 🌌 ZOOM EXTREMES
// controls.minDistance = 0.1;      // Zoom all the way in
// controls.maxDistance = 42;     // Zoom all the way out

// // 🔄 FULL ORBIT (no angle locks)
// controls.minPolarAngle = 0;
// controls.maxPolarAngle = Math.PI;

// let currentModel = null;
// let currentView = 'base';

// Models data
// const models = {
//   mars:   { path: './models/mars/scene.gltf', name: 'Mars' },
//   rover:  { path: './models/mars_rover/scene.gltf', name: 'Mars Rover' },
//   base:   { path: './models/mars_one_mission_base/scene.gltf', name: 'Mission Base' },
//   desert: { path: './models/mars_desert_research_station/scene.gltf', name: 'Desert Station' }
// // }
// const models = {
//   // mars:   { path: '/models/marster/scene.glb', name: 'Mars Terrain' },
//   // rover:  { path: '/models/mars_rover/scene.gltf', name: 'Mars Rover' },
//   base:   { path: './models/mars_one_mission_base/scene.gltf', name: 'Mission Base' },
//   // desert: { path: '/models/mars_desert_research_station/scene.gltf', name: 'Desert Station' }
// };

// async function loadModel(path) {
//   console.log(`Loading: ${path}`);
//   return new Promise((resolve, reject) => {
//     const loader = new GLTFLoader();
//     loader.load(
//       path,
//       gltf => {
//         console.log(`Loaded successfully: ${path}`);
//         resolve(gltf.scene);
//       },
//       undefined,
//       error => {
//         console.error(`❌ Error loading ${path}:`, error);
//         reject(error);
//       }
//     );
//   });
// }

// // async function showModel(key) {
// //   if (currentModel) {
// //     scene.remove(currentModel);
// //     currentModel.traverse(c => {
// //       if (c.isMesh) {
// //         c.geometry.dispose();
// //         if (c.material.map) c.material.map.dispose();
// //         c.material.dispose();
// //       }
// //     });
// //     currentModel = null;
// //   }

// //   try {
// //     const model = await loadModel(models[key].path);
// //     currentModel = model;

// //     // 🔁 Adjust settings per model
// //     switch (key) {
// //       case 'rover':
// //         currentModel.scale.set(10, 10, 10);
// //         currentModel.position.set(0, 0, 0);
// //         break;
// //       case 'mars':
// //         currentModel.scale.set(0.015, 0.015, 0.015);  // High-poly, so scale it small
// //         currentModel.position.set(0, -3, 0);          // Sink it slightly if floating
// //         break;
// //       case 'desert':
// //         currentModel.scale.set(2, 2, 2);
// //         currentModel.position.set(0, 0, 0);
// //         break;
// //       case 'base':
// //         currentModel.scale.set(1.5, 1.5, 1.5);
// //         currentModel.position.set(0, 0, 0);
// //         break;
// //       default:
// //         currentModel.scale.set(1, 1, 1);
// //         currentModel.position.set(0, 0, 0);
// //     }

// //     scene.add(currentModel);
// //     controls.reset();
// //   } catch (e) {
// //     console.error('Model loading error:', e);
// //   }
// // }

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
//     currentModel.position.set(0, 0, 0);
//     currentModel.scale.set(1.5, 1.5, 1.5);
//     scene.add(currentModel);
//     controls.reset();
//   } catch (e) {
//     console.error('Model loading error:', e);
//   }
// }

// function showMapPlaceholder() {
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

//   let existing = document.getElementById('map-placeholder');
//   if (!existing) {
//     const div = document.createElement('div');
//     div.id = 'map-placeholder';
//     div.style.position = 'absolute';
//     div.style.top = '50%';
//     div.style.left = '50%';
//     div.style.transform = 'translate(-50%, -50%)';
//     div.style.color = 'white';
//     div.style.fontSize = '2rem';
//     div.style.fontFamily = "'Orbitron', sans-serif";
//     div.style.textAlign = 'center';
//     div.style.pointerEvents = 'none';
//     div.textContent = 'Map Walkthrough Coming Soon... 🚀';
//     document.body.appendChild(div);
//   }
// }

// function removeMapPlaceholder() {
//   const existing = document.getElementById('map-placeholder');
//   if (existing) existing.remove();
// }

// // Navbar container & buttons
// const navContainer = document.createElement('div');
// navContainer.className = 'navbar';  // Use CSS class from your style in index.html

// Object.entries(models).forEach(([key, { name }]) => {
//   const btn = document.createElement('button');
//   btn.textContent = name;
//   btn.className = 'nav-item';   // Use CSS class from your style in index.html
//   btn.addEventListener('click', () => {
//     if (currentView === 'map') removeMapPlaceholder();
//     currentView = key;
//     showModel(key);
//   });
//   navContainer.appendChild(btn);
// });

// // Map tab button
// const mapBtn = document.createElement('button');
// mapBtn.textContent = 'Map Walkthrough';
// mapBtn.className = 'nav-item';   // Use same CSS styling
// mapBtn.addEventListener('click', () => {
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
//   currentView = 'map';
//   showMapPlaceholder();
// });
// navContainer.appendChild(mapBtn);


// // Add this at the top of your script or near your globals
// let weatherVisible = false;

// // Weather Button
// const weatherBtn = document.createElement('button');
// weatherBtn.textContent = 'Weather Insights';
// weatherBtn.className = 'nav-item';
// weatherBtn.addEventListener('click', () => {
//   weatherVisible = !weatherVisible;
//   if (weatherVisible) {
//     showWeatherInsights();
//     currentView = 'weather';
//   } else {
//     removeWeatherPanel();
//   }
// });
// navContainer.appendChild(weatherBtn);
// document.body.appendChild(navContainer);

// // Show Weather Panel
// async function showWeatherInsights() {
//   if (document.getElementById('weather-container')) return;

//   const key = 'DEMO_KEY'; // Replace with real key
//   const proxy = "https://corsproxy.io/?";
//   const url = `${proxy}https://api.nasa.gov/insight_weather/?api_key=${key}&feedtype=json&ver=1.0`;

//   try {
//     const res = await fetch(url);
//     const data = await res.json();
//     const solKeys = data.sol_keys || [];

//     const container = document.createElement('div');
//     container.id = 'weather-container';
//     container.style = `
//       position: fixed;
//       top: 10px;
//       left: 10px;
//       bottom: 10px;
//       overflow-y: auto;
//       color: white;
//       padding: 1rem;
//       background: rgba(0, 0, 0, 0.7);
//       max-width: 320px;
//       font-family: 'Orbitron', monospace;
//       z-index: 1;
//       border-radius: 8px;
//       box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
//     `;
//     container.innerHTML = '<h2>Mars Weather Insights</h2>';

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
//     });

//     document.body.appendChild(container);
//   } catch (e) {
//     console.error('Weather fetch failed:', e);
//   }
// }

// // Remove Weather Panel
// function removeWeatherPanel() {
//   const container = document.getElementById('weather-container');
//   if (container) container.remove();
// }

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
// // }

// let galleryVisible = false;

// // Photo Gallery Button
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

// // Function to show photo gallery
// async function showPhotoGallery() {
//   if (document.getElementById('gallery-container')) return;

//   const key = 'DEMO_KEY';
//   const sol = 1000;
//   const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=${sol}&api_key=${key}`;

//   try {
//     const res = await fetch(url);
//     const data = await res.json();
//     const photos = [...new Map(data.photos.map(p => [p.img_src, p])).values()].slice(0, 10); // get unique & limit to 10

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
//       const thumb = document.createElement('img');
//       thumb.src = photo.img_src;
//       thumb.alt = "Mars Rover";
//       thumb.style = "width: 100%; border-radius: 4px; cursor: pointer; margin-bottom: 0.5rem;";
//       thumb.addEventListener('click', () => openImageModal(photo.img_src, photo.earth_date, photo.camera.full_name));
//       container.appendChild(thumb);
//     });

//     document.body.appendChild(container);
//   } catch (e) {
//     console.error("Gallery fetch failed:", e);
//   }
// }

// function removeGallery() {
//   const container = document.getElementById('gallery-container');
//   if (container) container.remove();
//   removeImageModal();
// }

// // Modal Functions
// function openImageModal(src, date, camera) {
//   removeImageModal(); // in case one already exists

//   const modal = document.createElement('div');
//   modal.id = 'image-modal';
//   modal.style = `
//     position: fixed;
//     top: 0;
//     left: 0;
//     width: 100vw;
//     height: 100vh;
//     background: rgba(0,0,0,0.9);
//     z-index: 999;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     font-family: Orbitron, monospace;
//   `;

//   const closeBtn = document.createElement('div');
//   closeBtn.textContent = '✖';
//   closeBtn.style = `
//     position: absolute;
//     top: 20px;
//     right: 30px;
//     font-size: 2rem;
//     color: white;
//     cursor: pointer;
//   `;
//   closeBtn.addEventListener('click', removeImageModal);

//   const img = document.createElement('img');
//   img.src = src;
//   img.style = `
//     max-width: 90%;
//     max-height: 80vh;
//     border-radius: 12px;
//     box-shadow: 0 0 15px rgba(255,255,255,0.3);
//   `;

//   const caption = document.createElement('div');
//   caption.textContent = `📅 ${date} | 📷 ${camera}`;
//   caption.style = "color: white; margin-top: 1rem; font-size: 1rem;";

//   modal.appendChild(closeBtn);
//   modal.appendChild(img);
//   modal.appendChild(caption);
//   document.body.appendChild(modal);
// }

// function removeImageModal() {
//   const modal = document.getElementById('image-modal');
//   if (modal) modal.remove();
// }

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

// // 1. Add Mars 360 Button to Navbar
// const mars360Btn = document.createElement('button');
// mars360Btn.textContent = 'Mars 360';
// mars360Btn.className = 'nav-item';
// mars360Btn.addEventListener('click', () => {
//   toggleMars360(true);
// });
// navContainer.appendChild(mars360Btn);

// // 2. Create Modal Container with 360 Viewport
// const mars360Modal = document.createElement('div');
// mars360Modal.id = 'mars360Modal';
// mars360Modal.style.cssText = `
//   display: none;
//   position: fixed;
//   top: 0; left: 0;
//   width: 100vw; height: 100vh;
//   background: black;
//   z-index: 1000;
//   overflow: hidden;
// `;

// // Create viewport container
// const viewport = document.createElement('div');
// viewport.id = 'viewport';
// viewport.style.cssText = `
//   position: absolute;
//   width: 200%;  // Wider than viewport for panning
//   height: 200%; // Taller than viewport for panning
//   overflow: hidden;
//   cursor: grab;
// `;

// // Create video container with transform origin
// const videoContainer = document.createElement('div');
// videoContainer.id = 'videoContainer';
// videoContainer.style.cssText = `
//   position: absolute;
//   width: 100%;
//   height: 100%;
//   transform-origin: center center;
//   will-change: transform;
// `;

// // Video Element
// const mars360Video = document.createElement('video');
// mars360Video.controls = false;
// mars360Video.loop = true;
// mars360Video.muted = true;
// mars360Video.setAttribute('playsinline', '');
// mars360Video.style.cssText = `
//   width: 100%;
//   height: 100%;
//   object-fit: cover;
// `;

// // 4. Close Button
// const closeBtn = document.createElement('button');
// closeBtn.textContent = '✖';
// closeBtn.style.cssText = `
//   position: absolute;
//   top: 10px;
//   right: 10px;
//   padding: 0.5rem 1rem;
//   font-size: 1.2rem;
//   z-index: 1001;
//   background: rgba(0,0,0,0.7);
//   color: white;
//   border: none;
//   cursor: pointer;
//   pointer-events: auto;
// `;
// closeBtn.onclick = () => toggleMars360(false);

// // 5. Control Buttons
// const controlBar = document.createElement('div');
// controlBar.style.cssText = `
//   position: absolute;
//   bottom: 20px;
//   display: flex;
//   gap: 10px;
//   z-index: 1001;
//   pointer-events: auto;
// `;

// ['a', 'b'].forEach(id => {
//   const btn = document.createElement('button');
//   btn.textContent = `Video ${id.toUpperCase()}`;
//   btn.style.cssText = `
//     padding: 0.5rem 1rem;
//     background: rgba(255,255,255,0.1);
//     color: white;
//     border: 1px solid white;
//     cursor: pointer;
//   `;
//   btn.onclick = () => playMars360(id);
//   controlBar.appendChild(btn);
// });

// // 6. Append Everything
// videoContainer.appendChild(mars360Video);
// viewport.appendChild(videoContainer);
// mars360Modal.appendChild(viewport);
// mars360Modal.appendChild(closeBtn);
// mars360Modal.appendChild(controlBar);
// document.body.appendChild(mars360Modal);

// // 360 Control Variables
// let isDragging = false;
// let startX, startY;
// let panX = 0, panY = 0;
// let scale = 1;
// const maxPan = 50; // Maximum pan amount in pixels
// const sensitivity = 0.5;

// // Mouse/Touch Event Handlers
// viewport.addEventListener('mousedown', (e) => {
//   isDragging = true;
//   startX = e.clientX - panX;
//   startY = e.clientY - panY;
//   viewport.style.cursor = 'grabbing';
// });

// document.addEventListener('mousemove', (e) => {
//   if (!isDragging) return;
  
//   panX = e.clientX - startX;
//   panY = e.clientY - startY;
  
//   // Constrain panning to reasonable limits
//   panX = Math.max(-maxPan, Math.min(panX, maxPan));
//   panY = Math.max(-maxPan, Math.min(panY, maxPan));
  
//   updateView();
// });

// document.addEventListener('mouseup', () => {
//   isDragging = false;
//   viewport.style.cursor = 'grab';
// });

// // Touch events
// viewport.addEventListener('touchstart', (e) => {
//   isDragging = true;
//   startX = e.touches[0].clientX - panX;
//   startY = e.touches[0].clientY - panY;
//   e.preventDefault();
// });

// document.addEventListener('touchmove', (e) => {
//   if (!isDragging) return;
  
//   panX = e.touches[0].clientX - startX;
//   panY = e.touches[0].clientY - startY;
  
//   // Constrain panning
//   panX = Math.max(-maxPan, Math.min(panX, maxPan));
//   panY = Math.max(-maxPan, Math.min(panY, maxPan));
  
//   updateView();
//   e.preventDefault();
// });

// document.addEventListener('touchend', () => {
//   isDragging = false;
// });

// // Wheel zoom
// viewport.addEventListener('wheel', (e) => {
//   e.preventDefault();
//   const zoomDelta = e.deltaY * -0.001;
//   scale += zoomDelta;
//   scale = Math.max(0.8, Math.min(scale, 1.5)); // Limit zoom range
//   updateView();
// });

// // Keyboard controls
// document.addEventListener('keydown', (e) => {
//   if (mars360Modal.style.display !== 'flex') return;
  
//   const panStep = 10;
  
//   switch(e.key) {
//     case 'ArrowUp': panY -= panStep; break;
//     case 'ArrowDown': panY += panStep; break;
//     case 'ArrowLeft': panX -= panStep; break;
//     case 'ArrowRight': panX += panStep; break;
//     case '+': case '=': 
//       scale = Math.min(1.5, scale + 0.1); 
//       break;
//     case '-': 
//       scale = Math.max(0.8, scale - 0.1); 
//       break;
//     case 'Escape': toggleMars360(false); break;
//   }
  
//   // Constrain values
//   panX = Math.max(-maxPan, Math.min(panX, maxPan));
//   panY = Math.max(-maxPan, Math.min(panY, maxPan));
  
//   updateView();
// });

// // Update the view transform
// function updateView() {
//   // The magic happens here - we move the video container opposite to the pan direction
//   // and scale it to create the 360° effect
//   videoContainer.style.transform = `
//     translate(${-panX}px, ${-panY}px)
//     scale(${scale})
//   `;
  
//   // Adjust viewport position to keep the video centered
//   viewport.style.left = `calc(50% + ${panX}px)`;
//   viewport.style.top = `calc(50% + ${panY}px)`;
// }

// // 7. Toggle Modal
// function toggleMars360(show) {
//   mars360Modal.style.display = show ? 'flex' : 'none';
//   if (show) {
//     playMars360('a');
//     // Reset view
//     panX = 0;
//     panY = 0;
//     scale = 1;
//     updateView();
//   } else {
//     mars360Video.pause();
//     mars360Video.src = '';
//   }
// }

// // 8. Play Selected Video
// function playMars360(id) {
//   mars360Video.src = `./videos/mars360${id}.webm`;
//   mars360Video.play().catch(console.error);
//   // Reset view when changing videos
//   panX = 0;
//   panY = 0;
//   scale = 1;
//   updateView();
// }
// // 1. Add Mars 360 Button to Navbar
// const mars360Btn = document.createElement('button');
// mars360Btn.textContent = 'Mars 360';
// mars360Btn.className = 'nav-item';
// mars360Btn.addEventListener('click', () => {
//   toggleMars360(true);
// });
// navContainer.appendChild(mars360Btn);

// // 2. Create Modal Container
// const mars360Modal = document.createElement('div');
// mars360Modal.id = 'mars360Modal';
// mars360Modal.style.cssText = `
//   display: none;
//   position: fixed;
//   top: 0; left: 0;
//   width: 100vw; height: 100vh;
//   background: black;
//   z-index: 1000;
//   justify-content: center;
//   align-items: center;
//   flex-direction: column;
// `;

// // 3. Video Element
// const mars360Video = document.createElement('video');
// mars360Video.controls = true;
// mars360Video.loop = true;
// mars360Video.muted = true;
// mars360Video.style.cssText = `
//   width: 100%;
//   height: 100%;
//   object-fit: cover;
//   pointer-events: auto;
// `;

// // 4. Close Button
// const closeBtn = document.createElement('button');
// closeBtn.textContent = '✖';
// closeBtn.style.cssText = `
//   position: absolute;
//   top: 10px;
//   right: 10px;
//   padding: 0.5rem 1rem;
//   font-size: 1.2rem;
//   z-index: 1001;
//   background: rgba(0,0,0,0.7);
//   color: white;
//   border: none;
//   cursor: pointer;
//   pointer-events: auto;
// `;
// closeBtn.onclick = () => toggleMars360(false);

// // 5. Control Buttons
// const controlBar = document.createElement('div');
// controlBar.style.cssText = `
//   position: absolute;
//   bottom: 20px;
//   display: flex;
//   gap: 10px;
//   z-index: 1001;
//   pointer-events: auto;
// `;

// ['a', 'b'].forEach(id => {
//   const btn = document.createElement('button');
//   btn.textContent = `Video ${id.toUpperCase()}`;
//   btn.style.cssText = `
//     padding: 0.5rem 1rem;
//     background: rgba(255,255,255,0.1);
//     color: white;
//     border: 1px solid white;
//     cursor: pointer;
//   `;
//   btn.onclick = () => playMars360(id);
//   controlBar.appendChild(btn);
// });

// // 6. Append Everything
// mars360Modal.appendChild(mars360Video);
// mars360Modal.appendChild(closeBtn);
// mars360Modal.appendChild(controlBar);
// document.body.appendChild(mars360Modal);

// // 7. Toggle Modal
// function toggleMars360(show) {
//   mars360Modal.style.display = show ? 'flex' : 'none';
//   if (show) playMars360('a');
//   else {
//     mars360Video.pause();
//     mars360Video.src = '';
//   }
// }

// // 8. Play Selected Video
// function playMars360(id) {
//   mars360Video.src = `./videos/mars360${id}.webm`;
//   mars360Video.play().catch(console.error);
// }



// function animate() {
//   requestAnimationFrame(animate);

//   if (currentModel) {
//     currentModel.rotation.y += 0.003;
//   }

//   controls.update();
//   renderer.render(scene, camera);
// }

// animate();

// window.addEventListener('resize', () => {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// });
// window.addEventListener("DOMContentLoaded", () => {
//   const marsTheme = document.getElementById("marsTheme");
//   if (marsTheme) {
//     marsTheme.play().catch(err => {
//       console.warn("Autoplay might be blocked:", err);
//     });
//   }
// });


// // Load initial model
// showModel('base');

