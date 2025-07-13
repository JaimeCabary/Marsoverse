import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0f); // Night Mars color

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Resize handler
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Load GLTFs
const loader = new GLTFLoader();

loader.load('/models/marslandscape/scene.gltf', (gltf) => {
  gltf.scene.scale.set(1.5, 1.5, 1.5);
  scene.add(gltf.scene);
}, undefined, console.error);

loader.load('/models/mars_one_mission_base/scene.gltf', (gltf) => {
  gltf.scene.position.set(5, 0, -5);
  gltf.scene.scale.set(1.2, 1.2, 1.2);
  scene.add(gltf.scene);
}, undefined, console.error);

// Orbit Controls (Optional for navigation)
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
