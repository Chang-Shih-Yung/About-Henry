import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import { token } from './service/keep.js'

import LoginView from './views/LoginView.vue'
import IntroView from './views/IntroView.vue'
import QAView from './views/QAView.vue'
import AboutView from './views/AboutView.vue'
import DataView from './views/DataView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/intro' },
    { path: '/login', component: LoginView, meta: { public: true } },
    { path: '/intro', component: IntroView },
    { path: '/qa', component: QAView },
    { path: '/about', component: AboutView },
    { path: '/data', component: DataView },
  ],
})

// ── Router guard（仿 Angular CanActivateFn）──────────────────
router.beforeEach((to) => {
  if (to.meta.public) return true
  if (!token.value) return { path: '/login' }
  return true
})

createApp(App).use(router).mount('#app')
