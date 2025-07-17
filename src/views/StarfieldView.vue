<template>
  <div ref="container" class="starfield-container">
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

const TEXT_SPEED = 10;

const container = ref(null);
const slugText = ref(props.slug);
let scene, camera, renderer, stars = [];
let animationFrameId = null;
let textMesh = null;
let font = null;

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
    size: 50,
    height: 2,
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
    color: 0xffffff,
    specular: 0xff0000,
    shininess: 150,
    flatShading: true
  });
  
  textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.x = centerOffset;
//  textMesh.position.y = -100;
  textMesh.position.z = -2500; // Start behind the camera
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

// Create a single star
const createStar = () => {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: Math.random() * 2 + 1,
    transparent: true,
    opacity: 0.8
  });
  
  // Position the star in 3D space
  const x = Math.random() * 2000 - 1000;
  const y = Math.random() * 2000 - 1000;
  const z = Math.random() * MAX_DEPTH - MAX_DEPTH / 2;
  
  const vertices = new Float32Array([x, y, z]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  
  const star = new THREE.Points(geometry, material);
  star.userData.speed = Math.random() * SPEED + 5; // Random speed
  scene.add(star);
  stars.push(star);
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
  
  // Animate text if it exists
  if (textMesh) {
    textMesh.position.z += TEXT_SPEED;
    //textMesh.rotation.y += Math.random() * 0.01;
    //textMesh.rotation.x += Math.random() * 0.01;
    
    // Reset text position when it gets too close
    if (textMesh.position.z > 500) {
      textMesh.position.z = -2500;
      // Randomly position the text in the view
      textMesh.position.x = (Math.random() - 0.5) * 1000;
      textMesh.position.y = (Math.random() - 0.5) * 500;
    }
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
  background-color: #000;
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
