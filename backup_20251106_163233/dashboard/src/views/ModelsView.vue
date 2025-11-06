<template>
  <div class="models-view">
    <div class="models-header">
      <h2>Gestion des Modèles</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddModelDialog = true">
          <el-icon><Plus /></el-icon>
          Ajouter Modèle
        </el-button>
        <el-button @click="refreshModels">
          <el-icon><Refresh /></el-icon>
          Actualiser
        </el-button>
      </div>
    </div>

    <!-- Search and filters -->
    <el-card class="filters-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="Rechercher un modèle..."
            :prefix-icon="Search"
            clearable
          />
        </el-col>
        <el-col :span="6">
          <el-select v-model="statusFilter" placeholder="Statut" clearable>
            <el-option label="Actif" value="active" />
            <el-option label="Inactif" value="inactive" />
            <el-option label="Chargement" value="loading" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="runtimeFilter" placeholder="Runtime" clearable>
            <el-option label="llama-server" value="llama-server" />
            <el-option label="default" value="default" />
            <el-option label="faster-whisper" value="faster-whisper" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="info" @click="clearFilters">
            Effacer Filtres
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Models grid -->
    <div class="models-grid">
      <el-row :gutter="20">
        <el-col 
          v-for="model in filteredModels" 
          :key="model.id"
          :span="8"
          class="model-col"
        >
          <el-card class="model-card" shadow="hover">
            <div class="model-header">
              <div class="model-title">
                <h3>{{ model.display_name }}</h3>
                <el-tag 
                  :type="getStatusTagType(model.status)" 
                  size="small"
                >
                  {{ getStatusLabel(model.status) }}
                </el-tag>
              </div>
              <div class="model-actions">
                <el-dropdown @command="(command) => handleModelAction(command, model)">
                  <el-button type="text" :icon="MoreFilled"></el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="start" :disabled="model.status === 'active'">
                        <el-icon><VideoPlay /></el-icon>
                        Démarrer
                      </el-dropdown-item>
                      <el-dropdown-item command="stop" :disabled="model.status === 'inactive'">
                        <el-icon><VideoPause /></el-icon>
                        Arrêter
                      </el-dropdown-item>
                      <el-dropdown-item command="restart" :disabled="model.status !== 'active'">
                        <el-icon><Refresh /></el-icon>
                        Redémarrer
                      </el-dropdown-item>
                      <el-dropdown-item divided command="edit">
                        <el-icon><Edit /></el-icon>
                        Éditer
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" class="danger-item">
                        <el-icon><Delete /></el-icon>
                        Supprimer
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <div class="model-info">
              <div class="info-row">
                <span class="info-label">Fichier:</span>
                <span class="info-value">{{ model.model_path.split('/').pop() }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Runtime:</span>
                <el-tag size="small">{{ model.llama_cpp_runtime }}</el-tag>
              </div>
              <div class="info-row">
                <span class="info-label">Ctx Size:</span>
                <span class="info-value">{{ model.parameters?.ctx_size || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">GPU Layers:</span>
                <span class="info-value">{{ model.parameters?.n_gpu_layers || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Découvert:</span>
                <span class="info-value">
                  <el-icon v-if="model.auto_discovered" color="#67c23a"><CircleCheckFilled /></el-icon>
                  <el-icon v-else color="#909399"><CircleCloseFilled /></el-icon>
                  {{ model.auto_discovered ? 'Auto' : 'Manuel' }}
                </span>
              </div>
            </div>

            <div class="model-stats">
              <div class="stat">
                <div class="stat-label">Uptime</div>
                <div class="stat-value">{{ model.uptime || '00:00:00' }}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Requêtes</div>
                <div class="stat-value">{{ model.request_count || 0 }}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Latence</div>
                <div class="stat-value">{{ model.avg_latency || 'N/A' }}ms</div>
              </div>
            </div>

            <div class="model-progress" v-if="model.status === 'loading'">
              <el-progress :percentage="model.loading_progress || 0" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Add Model Dialog -->
    <el-dialog 
      v-model="showAddModelDialog" 
      title="Ajouter un Nouveau Modèle" 
      width="600px"
      :before-close="resetAddModelForm"
    >
      <el-form 
        ref="addModelForm" 
        :model="newModel" 
        :rules="modelRules" 
        label-width="120px"
      >
        <el-form-item label="Nom d'affichage" prop="display_name">
          <el-input v-model="newModel.display_name" placeholder="ex: Qwen3-7B-Instruct" />
        </el-form-item>
        
        <el-form-item label="Chemin du fichier" prop="model_path">
          <el-input v-model="newModel.model_path" placeholder="Chemin vers le fichier .gguf" />
          <el-button size="small" @click="browseModelFile" style="margin-top: 8px;">
            <el-icon><FolderOpened /></el-icon>
            Parcourir
          </el-button>
        </el-form-item>
        
        <el-form-item label="Runtime" prop="llama_cpp_runtime">
          <el-select v-model="newModel.llama_cpp_runtime" placeholder="Sélectionner un runtime">
            <el-option label="llama-server" value="llama-server" />
            <el-option label="default" value="default" />
            <el-option label="faster-whisper" value="faster-whisper" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Auto-découverte">
          <el-switch v-model="newModel.auto_discovered" />
        </el-form-item>
        
        <el-divider>Paramètres Avancés</el-divider>
        
        <el-form-item label="Ctx Size">
          <el-input-number v-model="newModel.parameters.ctx_size" :min="1024" :max="131072" :step="1024" />
        </el-form-item>
        
        <el-form-item label="GPU Layers">
          <el-input-number v-model="newModel.parameters.n_gpu_layers" :min="0" :max="200" />
        </el-form-item>
        
        <el-form-item label="Température">
          <el-slider v-model="newModel.parameters.temp" :min="0" :max="2" :step="0.1" show-input />
        </el-form-item>
        
        <el-form-item label="Top P">
          <el-slider v-model="newModel.parameters.top_p" :min="0" :max="1" :step="0.05" show-input />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddModelDialog = false">Annuler</el-button>
        <el-button type="primary" @click="addModel" :loading="isAddingModel">
          Ajouter
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Plus, 
  Refresh, 
  Search, 
  MoreFilled, 
  VideoPlay, 
  VideoPause, 
  Edit, 
  Delete, 
  CircleCheckFilled, 
  CircleCloseFilled,
  FolderOpened 
} from '@element-plus/icons-vue'

// Reactive data
const showAddModelDialog = ref(false)
const isAddingModel = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const runtimeFilter = ref('')

const addModelForm = ref(null)

// New model form
const newModel = ref({
  display_name: '',
  model_path: '',
  llama_cpp_runtime: 'llama-server',
  auto_discovered: false,
  parameters: {
    ctx_size: 32000,
    n_gpu_layers: 50,
    temp: 0.7,
    top_p: 0.95
  }
})

// Model validation rules
const modelRules = {
  display_name: [
    { required: true, message: 'Le nom d\'affichage est requis', trigger: 'blur' }
  ],
  model_path: [
    { required: true, message: 'Le chemin du fichier est requis', trigger: 'blur' }
  ],
  llama_cpp_runtime: [
    { required: true, message: 'Le runtime est requis', trigger: 'change' }
  ]
}

// Models data (would come from API/store)
const models = ref([
  {
    id: 1,
    display_name: 'Qwen3-1.7B-Q8_0',
    model_path: 'F:/llm/llama/models/Qwen3-1.7B-Q8_0-GGUF/Qwen3-1.7B-Q8_0.gguf',
    llama_cpp_runtime: 'llama-server',
    status: 'active',
    auto_discovered: false,
    parameters: {
      ctx_size: 8000,
      n_gpu_layers: 50,
      temp: 0.2,
      top_p: 0.95
    },
    uptime: '02:45:30',
    request_count: 1247,
    avg_latency: '156ms'
  },
  {
    id: 2,
    display_name: 'whisper-tiny',
    model_path: 'tiny',
    llama_cpp_runtime: 'faster-whisper',
    status: 'active',
    auto_discovered: true,
    parameters: {
      device: 'cpu',
      compute_type: 'int8',
      threads: 4
    },
    uptime: '01:12:45',
    request_count: 89,
    avg_latency: '2.3s'
  }
  // Add more models as needed
])

// Computed properties
const filteredModels = computed(() => {
  let filtered = models.value

  if (searchQuery.value) {
    filtered = filtered.filter(model => 
      model.display_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(model => model.status === statusFilter.value)
  }

  if (runtimeFilter.value) {
    filtered = filtered.filter(model => model.llama_cpp_runtime === runtimeFilter.value)
  }

  return filtered
})

// Methods
const refreshModels = async () => {
  // Refresh models from API
  console.log('Refreshing models...')
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  runtimeFilter.value = ''
}

const getStatusTagType = (status) => {
  const types = {
    'active': 'success',
    'inactive': 'info',
    'loading': 'warning',
    'error': 'danger'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    'active': 'Actif',
    'inactive': 'Inactif',
    'loading': 'Chargement',
    'error': 'Erreur'
  }
  return labels[status] || 'Inconnu'
}

const handleModelAction = async (command, model) => {
  switch (command) {
    case 'start':
      await startModel(model)
      break
    case 'stop':
      await stopModel(model)
      break
    case 'restart':
      await restartModel(model)
      break
    case 'edit':
      editModel(model)
      break
    case 'delete':
      await deleteModel(model)
      break
  }
}

const startModel = async (model) => {
  model.status = 'loading'
  // Simulate API call
  setTimeout(() => {
    model.status = 'active'
    model.uptime = '00:00:01'
  }, 2000)
}

const stopModel = async (model) => {
  model.status = 'inactive'
  model.uptime = null
}

const restartModel = async (model) => {
  model.status = 'loading'
  setTimeout(() => {
    model.status = 'active'
    model.uptime = '00:00:01'
  }, 1500)
}

const editModel = (model) => {
  console.log('Editing model:', model)
  // Open edit dialog
}

const deleteModel = async (model) => {
  // Confirmation dialog
  ElMessageBox.confirm(
    `Êtes-vous sûr de vouloir supprimer le modèle "${model.display_name}" ?`,
    'Confirmer la suppression',
    {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    }
  ).then(() => {
    const index = models.value.findIndex(m => m.id === model.id)
    if (index > -1) {
      models.value.splice(index, 1)
    }
    ElMessage.success('Modèle supprimé avec succès')
  }).catch(() => {
    ElMessage.info('Suppression annulée')
  })
}

const browseModelFile = () => {
  // Open file dialog (would need native API integration)
  console.log('Opening file browser...')
}

const resetAddModelForm = () => {
  newModel.value = {
    display_name: '',
    model_path: '',
    llama_cpp_runtime: 'llama-server',
    auto_discovered: false,
    parameters: {
      ctx_size: 32000,
      n_gpu_layers: 50,
      temp: 0.7,
      top_p: 0.95
    }
  }
  if (addModelForm.value) {
    addModelForm.value.resetFields()
  }
}

const addModel = async () => {
  if (!addModelForm.value) return
  
  await addModelForm.value.validate(async (valid) => {
    if (valid) {
      isAddingModel.value = true
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Add to models list
        models.value.push({
          id: Date.now(),
          ...newModel.value,
          status: 'inactive'
        })
        
        showAddModelDialog.value = false
        resetAddModelForm()
        
        ElMessage.success('Modèle ajouté avec succès')
      } catch (error) {
        ElMessage.error('Erreur lors de l\'ajout du modèle')
      } finally {
        isAddingModel.value = false
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  refreshModels()
})
</script>

<style lang="scss" scoped>
.models-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.models-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    color: #303133;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.filters-card {
  margin-bottom: 20px;
}

.models-grid {
  flex: 1;
  overflow-y: auto;
}

.model-col {
  margin-bottom: 20px;
}

.model-card {
  height: 100%;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;

  .model-title {
    flex: 1;

    h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: #303133;
      font-weight: 500;
    }
  }
}

.model-info {
  margin-bottom: 16px;

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: 14px;
      color: #909399;
    }

    .info-value {
      font-size: 14px;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.model-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 12px;

  .stat {
    text-align: center;

    .stat-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.model-progress {
  margin-top: 12px;
}

.danger-item {
  color: #f56c6c !important;

  .el-icon {
    color: #f56c6c !important;
  }
}

// Responsive design
@media (max-width: 1200px) {
  .model-col {
    :deep(.el-col) {
      width: 50% !important;
    }
  }
}

@media (max-width: 768px) {
  .models-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
  
  .model-col {
    :deep(.el-col) {
      width: 100% !important;
    }
  }
  
  .model-stats {
    flex-direction: column;
    gap: 12px;
  }
}
</style>