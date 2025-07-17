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
    path: '/starfield',
    name: 'StarfieldView',
    component: StarfieldView
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
