// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import StarfieldView from '@/views/StarfieldView.vue'

const routes = [
  {
    path: '/',
    redirect: () => {
      const views = ['starfield'];
      const randomView = views[Math.floor(Math.random() * views.length)];
      if (randomView === 'starfield') {
        return '/starfield';
      }
    }
  },
  {
    path: '/starfield/:slug?',
    name: 'StarfieldView',
    component: StarfieldView,
    props: true
  },
  {
    // Redirect root to starfield with a random slug
    path: '/',
    redirect: () => {
      const adjectives = ['cosmic', 'stellar', 'galactic', 'celestial', 'interstellar'];
      const nouns = ['voyage', 'odyssey', 'journey', 'expedition', 'adventure'];
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
      const randomSlug = `${randomAdjective}-${randomNoun}-${Math.floor(Math.random() * 1000)}`;
      return `/starfield/${randomSlug}`;
    }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
