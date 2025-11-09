import { createRouter, createWebHistory } from 'vue-router'

// Import views
import DashboardView from '@/views/DashboardView.vue'
import ModelsView from '@/views/ModelsView.vue'
import AudioView from '@/views/AudioView.vue'
import ProxyView from '@/views/ProxyView.vue'
import ConfigView from '@/views/ConfigView.vue'
import LogsView from '@/views/LogsView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      title: 'Dashboard',
      icon: 'Monitor'
    }
  },
  {
    path: '/models',
    name: 'models',
    component: ModelsView,
    meta: {
      title: 'Modèles',
      icon: 'Cpu'
    }
  },
  {
    path: '/audio',
    name: 'audio',
    component: AudioView,
    meta: {
      title: 'Audio',
      icon: 'Microphone'
    }
  },
  {
    path: '/proxy',
    name: 'proxy',
    component: ProxyView,
    meta: {
      title: 'Proxy',
      icon: 'Connection'
    }
  },
  {
    path: '/config',
    name: 'config',
    component: ConfigView,
    meta: {
      title: 'Configuration',
      icon: 'Setting'
    }
  },
  {
    path: '/logs',
    name: 'logs',
    component: LogsView,
    meta: {
      title: 'Logs',
      icon: 'Document'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication (if needed)
router.beforeEach((to, from, next) => {
  // Set page title
  if (to.meta.title) {
    document.title = `Llama Runner - ${to.meta.title}`
  }
  
  next()
})

export default router