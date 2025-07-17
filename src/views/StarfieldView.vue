<template>
  <div ref="container" class="starfield-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';

const container = ref(null);
let scene, camera, renderer, stars = [];
let animationFrameId = null;

// Starfield parameters
const STAR_COUNT = 1000;
const MAX_DEPTH = 2000;
const SPEED = 10;

// Initialize the scene
const init = () => {
  // Scene setup
  scene = new THREE.Scene();
  
  // Camera setup
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
  camera.position.z = 0;
  
  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);
  
  // Create stars
  for (let i = 0; i < STAR_COUNT; i++) {
    createStar();
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
  
  renderer.render(scene, camera);
};

// Handle window resize
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// Lifecycle hooks
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
  
  // Clean up Three.js objects
  if (renderer) {
    renderer.dispose();
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
</style>
