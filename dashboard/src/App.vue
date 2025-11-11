<template>
  <div id="app">
    <!-- Navigation Header -->
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <img src="./app_icon.png" alt="Llama Runner" class="app-logo">
          <h1 class="app-title">Llama Runner Dashboard</h1>
        </div>
        
        <div class="header-actions">
          <el-badge :value="connectedModels" class="item">
            <el-button type="primary" :icon="Connection" circle></el-button>
          </el-badge>
          
          <el-dropdown @command="handleCommand">
            <el-button type="primary" :icon="User" circle></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="settings">Paramètres</el-dropdown-item>
                <el-dropdown-item command="restart">Redémarrer</el-dropdown-item>
                <el-dropdown-item divided command="quit">Quitter</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- Main Navigation -->
    <el-container class="app-container">
      <el-aside width="250px" class="app-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          @select="handleMenuSelect"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="dashboard">
            <el-icon><Monitor /></el-icon>
            <span>Dashboard</span>
          </el-menu-item>
          
          <el-menu-item index="models">
            <el-icon><Cpu /></el-icon>
            <span>Modèles</span>
          </el-menu-item>
          
          <el-menu-item index="audio">
            <el-icon><Microphone /></el-icon>
            <span>Audio</span>
          </el-menu-item>
          
          <el-menu-item index="proxy">
            <el-icon><Connection /></el-icon>
            <span>Proxy</span>
          </el-menu-item>
          
          <el-menu-item index="config">
            <el-icon><Setting /></el-icon>
            <span>Configuration</span>
          </el-menu-item>
          
          <el-menu-item index="logs">
            <el-icon><Document /></el-icon>
            <span>Logs</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- Main Content Area -->
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </el-main>
    </el-container>

    <!-- System Tray Integration (hidden by default) -->
    <div ref="trayIcon" class="tray-icon" style="display: none;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from './stores/app'
import { 
  Monitor, 
  Cpu, 
  Microphone, 
  Connection, 
  Setting, 
  Document, 
  User 
} from '@element-plus/icons-vue'

// Stores
const appStore = useAppStore()
const router = useRouter()
const route = useRoute()

// Reactive data
const connectedModels = computed(() => appStore.connectedModelsCount)

// Active menu item
const activeMenu = ref('dashboard')

// Methods
const handleMenuSelect = (index) => {
  activeMenu.value = index
  router.push({ name: index })
}

const handleCommand = (command) => {
  switch (command) {
    case 'settings':
      router.push({ name: 'config' })
      break
    case 'restart':
      appStore.restartService()
      break
    case 'quit':
      appStore.quitApplication()
      break
  }
}

// Lifecycle
onMounted(() => {
  // Initialize WebSocket connection
  appStore.initializeWebSocket()
  
  // Load initial data
  appStore.loadDashboardData()
})
</script>

<style lang="scss" scoped>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid #e6e6e6;
  padding: 0;
  height: 60px;
  line-height: 60px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    padding: 0 20px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;

    .app-logo {
      width: 32px;
      height: 32px;
    }

    .app-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.app-container {
  flex: 1;
  height: calc(100vh - 60px);
}

.app-sidebar {
  background-color: #545c64;
  border-right: 1px solid #e6e6e6;

  .sidebar-menu {
    border: none;
    height: 100%;
  }
}

.app-main {
  background: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
}

.tray-icon {
  position: absolute;
  top: -9999px;
  left: -9999px;
}

// Responsive design
@media (max-width: 768px) {
  .app-sidebar {
    width: 200px !important;
  }
  
  .app-header {
    .header-content {
      padding: 0 15px;
    }
    
    .app-title {
      font-size: 16px;
    }
  }
}

@media (max-width: 576px) {
  .app-sidebar {
    display: none;
  }
  
  .app-main {
    padding: 15px;
  }
}
</style>
