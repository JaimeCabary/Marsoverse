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
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.minDistance = 1.5;
controls.maxDistance = 20;

let currentModel = null;
let currentView = 'mars';

// Models data
const models = {
  mars: { path: '/models/mars/scene.gltf', name: 'Mars' },
  rover: { path: '/models/mars_rover/scene.gltf', name: 'Mars Rover' },
  base: { path: '/models/mars_one_mission_base/scene.gltf', name: 'Mission Base' },
  desert: { path: '/models/mars_desert_research_station/scene.gltf', name: 'Desert Station' }
  // spacesuiit: {path: '/models/franz_viehbocks_spacesuit/scene.gltf', name: 'Space suit'}
};

async function loadModel(path) {
  return new Promise((resolve, reject) => {
    loader.load(path, gltf => resolve(gltf.scene), undefined, reject);
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

document.body.appendChild(navContainer);

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

// Load initial model
showModel('base');

