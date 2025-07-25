<template>
  <div ref="container" class="starfield-container" :style="{ backgroundColor: coolorsAsHex[Math.floor(Math.random() * coolorsAsHex.length)] }">
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

const props = defineProps({
  slug: {
    type: String,
    default: ''
  }
});

const container = ref(null);
const slugText = ref(props.slug);
let scene, camera, renderer, stars = [];
let animationFrameId = null;
let textMesh = null;
let font = null;
const mouse = new THREE.Vector2();
const targetPosition = new THREE.Vector3();

// Starfield parameters
const STAR_COUNT = 2000;
const MAX_DEPTH = 2000;
const SPEED = 10;

// Load font
const fontLoader = new FontLoader();

// Add lights to the scene
const addLights = () => {
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
};

// Create text geometry from slug
const createText = () => {
  if (!slugText.value || !font) return;
  
  // Remove existing text if any
  if (textMesh) {
    scene.remove(textMesh);
    textMesh.geometry.dispose();
    textMesh.material.dispose();
  }
  
  const textGeometry = new TextGeometry(slugText.value, {
    font: font,
    size: 100,
    height: 100,
    curveSegments: 4,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.3,
    bevelOffset: 0,
    bevelSegments: 2
  });
  
  textGeometry.computeBoundingBox();
  const centerOffset = -0.5 * (
    textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x
  );
  
  const textMaterial = new THREE.MeshPhongMaterial({
    // make the color random
    color: coolors[Math.floor(Math.random() * coolors.length)],
    specular: 0xff0000,
    shininess: 150,
    flatShading: true
  });
  
  textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.x = centerOffset;
//  textMesh.position.y = -100;
  textMesh.position.z = -500; // Start behind the camera
  scene.add(textMesh);
};

// Initialize the scene
const init = async () => {
  // Scene setup
  scene = new THREE.Scene();
  
  // Camera setup
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
  camera.position.z = 0;
  
  // Set up renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Add mousemove event listener
  container.value.addEventListener('mousemove', onMouseMove);
  container.value.appendChild(renderer.domElement);
  
  // Load font
  try {
    font = await new Promise((resolve, reject) => {
      fontLoader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        resolve,
        undefined,
        reject
      );
    });
  } catch (error) {
    console.error('Failed to load font:', error);
  }
  
  // Create stars
  for (let i = 0; i < STAR_COUNT; i++) {
    createStar();
  }
  
  // Add lights and create text if slug is provided
  addLights();
  if (slugText.value) {
    createText();
  }
};

const coolors = [0xffbe0b, 0xfb5607, 0xff006e, 0x8338ec, 0x3a86ff];
const coolorsAsHex = coolors.map(color => `#${color.toString(16)}`);

// Create a single star
const createStar = () => {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({
//    color: coolors[Math.floor(Math.random() * coolors.length)],
    color: 0xffffff,
    size: Math.random() * 9 + 1,
    transparent: true,
    opacity: 0.8
  });
  
  // Position the star in 3D space
  const x = Math.random() * 2000 - 1000;
  const y = Math.random() * 2000 - 1000;
  const z = Math.random() * MAX_DEPTH - MAX_DEPTH;
  
  const vertices = new Float32Array([x, y, z]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  
  const star = new THREE.Points(geometry, material);
  star.userData.speed = Math.random() * SPEED + 5; // Random speed
  scene.add(star);
  stars.push(star);
};

// Handle mouse move
const onMouseMove = (event) => {
  // Calculate mouse position in normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
};

// Animation loop
const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  
  // Move stars towards the camera
  stars.forEach(star => {
    star.position.z += star.userData.speed;
    
    // If star is too close to camera, reset it to the back
    if (star.position.z > 1000) {
      star.position.z = -MAX_DEPTH / 2;
      star.position.x = Math.random() * 2000 - 1000;
      star.position.y = Math.random() * 2000 - 1000;
      star.userData.speed = Math.random() * SPEED + 5; // Randomize speed on reset
    }
  });
  
  // Update text position to follow mouse
  if (textMesh) {
    // Convert mouse position to 3D world position
    targetPosition.set(
      mouse.x * (window.innerWidth / 4), // Adjust multiplier for sensitivity
      mouse.y * (window.innerHeight / 4),
      -500 // Keep the same Z position
    );
    
    // Smoothly interpolate to target position
    textMesh.position.lerp(targetPosition, 0.1);
    
    // Add a subtle rotation based on mouse position
    textMesh.rotation.y = mouse.x * 0.5;
    textMesh.rotation.x = -mouse.y * 0.2;
  }
  
  renderer.render(scene, camera);
};

// Handle window resize
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// Lifecycle hooks
// Watch for slug changes
watch(() => props.slug, (newSlug) => {
  slugText.value = newSlug;
  if (font) {
    createText();
  }
});

onMounted(() => {
  init();
  animate();
  window.addEventListener('resize', onWindowResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // Remove mousemove event listener
  if (container.value) {
    container.value.removeEventListener('mousemove', onMouseMove);
  }
  
  // Clean up renderer
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer.forceContextLoss();
    renderer = null;
  }
  
  if (scene) {
    scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
});
</script>

<style scoped>
.starfield-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  /*background-color: #ffbe0b;*/
}

canvas {
  display: block;
}

.slug-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #00ffff;
  font-family: 'Arial', sans-serif;
  font-size: 24px;
  text-align: center;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
  opacity: 0.8;
  pointer-events: none;
  z-index: 100;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}
</style>
