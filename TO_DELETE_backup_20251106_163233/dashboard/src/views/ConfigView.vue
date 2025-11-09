<template>
  <div class="config-view">
    <div class="config-header">
      <h2>Configuration</h2>
      <div class="header-actions">
        <el-button type="primary" @click="saveConfig" :loading="isSaving">
          <el-icon><DocumentChecked /></el-icon>
          Sauvegarder
        </el-button>
        <el-button @click="reloadConfig">
          <el-icon><Refresh /></el-icon>
          Recharger
        </el-button>
        <el-button type="success" @click="showHotReloadInfo = true">
          <el-icon><Lightning /></el-icon>
          Hot Reload
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- Configuration Tabs -->
      <el-col :span="18">
        <el-tabs v-model="activeTab" type="border-card" class="config-tabs">
          
          <!-- General Settings -->
          <el-tab-pane label="Général" name="general">
            <div class="tab-content">
              <el-form :model="config.general" label-width="180px">
                <el-form-item label="Mode d'exécution">
                  <el-select v-model="config.general.execution_mode">
                    <el-option label="Interface graphique" value="gui" />
                    <el-option label="Headless (sans interface)" value="headless" />
                    <el-option label="Service" value="service" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="Port de base">
                  <el-input-number v-model="config.general.base_port" :min="1024" :max="65535" />
                  <span class="form-help">Port de base pour l'attribution automatique</span>
                </el-form-item>
                
                <el-form-item label="Runners concurrents">
                  <el-input-number v-model="config.general.concurrent_runners" :min="1" :max="10" />
                  <span class="form-help">Nombre maximum de modèles actifs simultanément</span>
                </el-form-item>
                
                <el-form-item label="Vérification auto">
                  <el-switch v-model="config.general.auto_validation" />
                  <span class="form-help">Valider automatiquement la configuration au démarrage</span>
                </el-form-item>
                
                <el-form-item label="Logs détaillés">
                  <el-switch v-model="config.general.verbose_logging" />
                  <span class="form-help">Activer les logs de debug</span>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <!-- Models Configuration -->
          <el-tab-pane label="Modèles" name="models">
            <div class="tab-content">
              <el-form :model="config.models" label-width="180px">
                <el-form-item label="Auto-découverte">
                  <el-switch v-model="config.models.auto_discovery.enabled" />
                  <span class="form-help">Détecter automatiquement les nouveaux modèles</span>
                </el-form-item>
                
                <el-form-item label="Chemin de base">
                  <el-input v-model="config.models.auto_discovery.base_path" placeholder="Chemin vers les modèles" />
                  <el-button size="small" @click="browseModelPath" style="margin-top: 8px;">
                    <el-icon><FolderOpened /></el-icon>
                    Parcourir
                  </el-button>
                </el-form-item>
                
                <el-form-item label="Auto-mise à jour">
                  <el-switch v-model="config.models.auto_discovery.auto_update" />
                  <span class="form-help">Mettre à jour automatiquement la config</span>
                </el-form-item>
                
                <el-divider>Paramètres Globaux</el-divider>
                
                <el-form-item label="Contexte par défaut">
                  <el-input-number v-model="config.models.global_parameters.ctx_size" :min="1024" :max="131072" :step="1024" />
                  <span class="form-help">Taille de contexte par défaut pour les nouveaux modèles</span>
                </el-form-item>
                
                <el-form-item label="GPU Layers par défaut">
                  <el-input-number v-model="config.models.global_parameters.n_gpu_layers" :min="0" :max="200" />
                  <span class="form-help">Nombre de couches GPU à utiliser par défaut</span>
                </el-form-item>
                
                <el-form-item label="Température">
                  <el-slider v-model="config.models.global_parameters.temp" :min="0" :max="2" :step="0.1" show-input />
                </el-form-item>
                
                <el-form-item label="Top P">
                  <el-slider v-model="config.models.global_parameters.top_p" :min="0" :max="1" :step="0.05" show-input />
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <!-- Proxy Settings -->
          <el-tab-pane label="Proxy" name="proxy">
            <div class="tab-content">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card shadow="never" class="proxy-card">
                    <template #header>
                      <div class="proxy-header">
                        <img src="https://img.icons8.com/color/32/labVIEW.png" class="proxy-icon">
                        <span>LM Studio Proxy</span>
                        <el-switch v-model="config.proxy.lmstudio.enabled" size="small" />
                      </div>
                    </template>
                    
                    <el-form :model="config.proxy.lmstudio" label-width="100px">
                      <el-form-item label="Port">
                        <el-input-number v-model="config.proxy.lmstudio.port" :min="1024" :max="65535" />
                      </el-form-item>
                      
                      <el-form-item label="API Key">
                        <el-input v-model="config.proxy.lmstudio.api_key" type="password" show-password />
                      </el-form-item>
                      
                      <el-form-item label="CORS">
                        <el-switch v-model="config.proxy.lmstudio.cors_enabled" />
                      </el-form-item>
                    </el-form>
                  </el-card>
                </el-col>
                
                <el-col :span="12">
                  <el-card shadow="never" class="proxy-card">
                    <template #header>
                      <div class="proxy-header">
                        <img src="https://img.icons8.com/color/32/docker.png" class="proxy-icon">
                        <span>Ollama Proxy</span>
                        <el-switch v-model="config.proxy.ollama.enabled" size="small" />
                      </div>
                    </template>
                    
                    <el-form :model="config.proxy.ollama" label-width="100px">
                      <el-form-item label="Port">
                        <el-input-number v-model="config.proxy.ollama.port" :min="1024" :max="65535" />
                      </el-form-item>
                      
                      <el-form-item label="URL Base">
                        <el-input v-model="config.proxy.ollama.base_url" placeholder="http://localhost:11434" />
                      </el-form-item>
                      
                      <el-form-item label="Audio">
                        <el-switch v-model="config.proxy.ollama.audio_enabled" />
                      </el-form-item>
                    </el-form>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>
          
          <!-- Audio Configuration -->
          <el-tab-pane label="Audio" name="audio">
            <div class="tab-content">
              <el-form :model="config.audio" label-width="180px">
                <el-form-item label="Service activé">
                  <el-switch v-model="config.audio.enabled" />
                </el-form-item>
                
                <el-divider>Modèles Audio</el-divider>
                
                <div class="audio-models">
                  <el-card 
                    v-for="(model, name) in config.audio.models" 
                    :key="name"
                    shadow="hover" 
                    class="audio-model-card"
                  >
                    <template #header>
                      <div class="model-header">
                        <span class="model-name">{{ name }}</span>
                        <el-tag size="small" :type="model.enabled ? 'success' : 'info'">
                          {{ model.enabled ? 'Actif' : 'Inactif' }}
                        </el-tag>
                      </div>
                    </template>
                    
                    <el-form-item label="Modèle">
                      <el-input v-model="model.model_path" />
                    </el-form-item>
                    
                    <el-form-item label="Device">
                      <el-select v-model="model.parameters.device">
                        <el-option label="CPU" value="cpu" />
                        <el-option label="CUDA" value="cuda" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="Compute Type">
                      <el-select v-model="model.parameters.compute_type">
                        <el-option label="int8" value="int8" />
                        <el-option label="float16" value="float16" />
                        <el-option label="float32" value="float32" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="Threads">
                      <el-input-number v-model="model.parameters.threads" :min="1" :max="16" />
                    </el-form-item>
                    
                    <el-form-item label="Langue">
                      <el-select v-model="model.parameters.language" clearable>
                        <el-option label="Français" value="fr" />
                        <el-option label="Anglais" value="en" />
                        <el-option label="Espagnol" value="es" />
                        <el-option label="Auto" value="auto" />
                      </el-select>
                    </el-form-item>
                  </el-card>
                </div>
              </el-form>
            </div>
          </el-tab-pane>
          
          <!-- Security & Monitoring -->
          <el-tab-pane label="Sécurité" name="security">
            <div class="tab-content">
              <el-form :model="config.security" label-width="200px">
                <el-form-item label="Authentification activée">
                  <el-switch v-model="config.security.authentication.enabled" />
                </el-form-item>
                
                <el-form-item label="API Key requise">
                  <el-switch v-model="config.security.api_key_required" />
                </el-form-item>
                
                <el-form-item label="Rate Limiting">
                  <el-input-number v-model="config.security.rate_limit.requests_per_minute" :min="1" :max="1000" />
                  <span class="form-help">Requêtes maximum par minute</span>
                </el-form-item>
                
                <el-form-item label="CORS Origins">
                  <el-input 
                    v-model="corsOrigins" 
                    type="textarea" 
                    :rows="3"
                    placeholder="https://example.com, https://app.example.com"
                  />
                </el-form-item>
                
                <el-divider>Monitoring</el-divider>
                
                <el-form-item label="Métriques activées">
                  <el-switch v-model="config.security.monitoring.enabled" />
                </el-form-item>
                
                <el-form-item label="Health Check">
                  <el-switch v-model="config.security.monitoring.health_check" />
                </el-form-item>
                
                <el-form-item label="Endpoint Health">
                  <el-input v-model="config.security.monitoring.health_endpoint" placeholder="/health" />
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <!-- Debug & Options -->
          <el-tab-pane label="Debug & Options" name="debug">
            <div class="tab-content">
              <el-alert 
                title="Mode Debug Activé" 
                type="warning" 
                :closable="false"
                v-if="config.debug.enabled"
                style="margin-bottom: 20px;"
              >
                <template #default>
                  Le mode debug est activé. Certaines fonctionnalités peuvent être plus lentes et générer plus de logs.
                </template>
              </el-alert>
              
              <el-form :model="config.debug" label-width="200px">
                <el-form-item label="Mode Debug">
                  <el-switch v-model="config.debug.enabled" />
                  <span class="form-help">Activer les informations de debug avancées</span>
                </el-form-item>
                
                <el-form-item label="Logs Détaillés">
                  <el-switch v-model="config.debug.detailed_logs" />
                  <span class="form-help">Inclure les traces détaillées dans les logs</span>
                </el-form-item>
                
                <el-form-item label="Niveau de Log">
                  <el-select v-model="config.debug.log_level">
                    <el-option label="ERROR" value="ERROR" />
                    <el-option label="WARN" value="WARN" />
                    <el-option label="INFO" value="INFO" />
                    <el-option label="DEBUG" value="DEBUG" />
                    <el-option label="TRACE" value="TRACE" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="Console Logs">
                  <el-switch v-model="config.debug.console_logs" />
                  <span class="form-help">Afficher les logs dans la console du navigateur</span>
                </el-form-item>
                
                <el-divider>Performance</el-divider>
                
                <el-form-item label="Profilage Activé">
                  <el-switch v-model="config.debug.profiling_enabled" />
                  <span class="form-help">Activer le profilage des performances</span>
                </el-form-item>
                
                <el-form-item label="Métriques Temps Réel">
                  <el-switch v-model="config.debug.real_time_metrics" />
                  <span class="form-help">Afficher les métriques en temps réel</span>
                </el-form-item>
                
                <el-form-item label="Monitoring Mémoire">
                  <el-switch v-model="config.debug.memory_monitoring" />
                  <span class="form-help">Surveiller l'utilisation de la mémoire</span>
                </el-form-item>
                
                <el-divider>Tests & Validation</el-divider>
                
                <el-form-item label="Tests Automatiques">
                  <el-switch v-model="config.debug.auto_tests" />
                  <span class="form-help">Lancer automatiquement les tests de configuration</span>
                </el-form-item>
                
                <el-form-item label="Validation Stricte">
                  <el-switch v-model="config.debug.strict_validation" />
                  <span class="form-help">Validation plus stricte des paramètres</span>
                </el-form-item>
                
                <el-form-item label="Mock Mode">
                  <el-switch v-model="config.debug.mock_mode" />
                  <span class="form-help">Utiliser des données simulées pour les tests</span>
                </el-form-item>
                
                <el-divider>Développement</el-divider>
                
                <el-form-item label="Hot Reload">
                  <el-switch v-model="config.debug.hot_reload" />
                  <span class="form-help">Rechargement automatique des modifications</span>
                </el-form-item>
                
                <el-form-item label="Source Maps">
                  <el-switch v-model="config.debug.source_maps" />
                  <span class="form-help">Activer les cartes sources pour le debug</span>
                </el-form-item>
                
                <el-form-item label="DevTools Integration">
                  <el-switch v-model="config.debug.devtools_integration" />
                  <span class="form-help">Intégration avec les outils de développement</span>
                </el-form-item>
                
                <el-divider>Advanced Options</el-divider>
                
                <el-form-item label="Workers">
                  <el-input-number v-model="config.debug.num_workers" :min="1" :max="16" />
                  <span class="form-help">Nombre de workers pour le traitement parallèle</span>
                </el-form-item>
                
                <el-form-item label="Mémoire Max (MB)">
                  <el-input-number v-model="config.debug.max_memory_mb" :min="512" :max="32768" :step="512" />
                  <span class="form-help">Limite de mémoire en mégaoctets</span>
                </el-form-item>
                
                <el-form-item label="Timeout (secondes)">
                  <el-input-number v-model="config.debug.timeout_seconds" :min="5" :max="300" />
                  <span class="form-help">Délai d'attente par défaut pour les opérations</span>
                </el-form-item>
                
                <el-form-item label="Auto-sauvegarde">
                  <el-switch v-model="config.debug.auto_save" />
                  <span class="form-help">Sauvegarde automatique de la configuration</span>
                </el-form-item>
                
                <el-form-item label="Intervalle Auto-sauvegarde">
                  <el-slider 
                    v-model="config.debug.auto_save_interval" 
                    :min="60" 
                    :max="3600" 
                    :step="60"
                    show-input
                    :format-tooltip="formatSeconds"
                  />
                  <span class="form-help">Intervalle entre les sauvegardes automatiques</span>
                </el-form-item>
                
                <el-form-item label="Formats d'Export">
                  <el-checkbox-group v-model="config.debug.export_formats">
                    <el-checkbox label="json">JSON</el-checkbox>
                    <el-checkbox label="yaml">YAML</el-checkbox>
                    <el-checkbox label="xml">XML</el-checkbox>
                    <el-checkbox label="ini">INI</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                
                <el-divider>Actions de Debug</el-divider>
                
                <div class="debug-actions">
                  <el-button type="warning" @click="runDiagnostics" :loading="isRunningDiagnostics">
                    <el-icon><Monitor /></el-icon>
                    Lancer les Diagnostics
                  </el-button>
                  
                  <el-button @click="clearLogs" :disabled="isClearingLogs">
                    <el-icon><Delete /></el-icon>
                    Effacer les Logs
                  </el-button>
                  
                  <el-button type="info" @click="exportDebugInfo">
                    <el-icon><Download /></el-icon>
                    Export Debug Info
                  </el-button>
                  
                  <el-button type="success" @click="applyDebugConfig" :loading="isApplyingConfig">
                    <el-icon><Check /></el-icon>
                    Appliquer Maintenant
                  </el-button>
                </div>
                
                <el-alert 
                  v-if="config.debug.enabled"
                  title="Configuration Debug Activée"
                  type="info"
                  :closable="false"
                  style="margin-top: 20px;"
                >
                  <template #default>
                    <p>Les paramètres debug sont maintenant actifs. Certains changements nécessitent un redémarrage pour prendre effet.</p>
                    <p><strong>Actions recommandées :</strong></p>
                    <ul>
                      <li>Vérifiez les logs pour les informations détaillées</li>
                      <li>Surveillez les performances avec le monitoring activé</li>
                      <li>Utilisez les tests automatiques pour valider la configuration</li>
                    </ul>
                  </template>
                </el-alert>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-col>
      
      <!-- Configuration Summary -->
      <el-col :span="6">
        <el-card class="summary-card" shadow="hover">
          <template #header>
            <span>Résumé Configuration</span>
          </template>
          
          <div class="summary-content">
            <div class="summary-item">
              <div class="summary-label">Statut</div>
              <div class="summary-value">
                <el-tag :type="configStatus.type">{{ configStatus.text }}</el-tag>
              </div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Modèles configurés</div>
              <div class="summary-value">{{ modelCount }}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Proxies actifs</div>
              <div class="summary-value">{{ activeProxiesCount }}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Audio activé</div>
              <div class="summary-value">
                <el-icon v-if="config.audio.enabled" color="#67c23a"><Check /></el-icon>
                <el-icon v-else color="#f56c6c"><Close /></el-icon>
              </div>
            </div>
          </div>
          
          <el-divider></el-divider>
          
          <div class="summary-actions">
            <el-button type="primary" @click="validateConfig" :loading="isValidating" size="small">
              <el-icon><Check /></el-icon>
              Valider
            </el-button>
            <el-button @click="resetToDefaults" size="small">
              <el-icon><Refresh /></el-icon>
              Défauts
            </el-button>
          </div>
        </el-card>
        
        <!-- Config History -->
        <el-card class="history-card" shadow="hover" style="margin-top: 20px;">
          <template #header>
            <span>Historique</span>
          </template>
          
          <div class="history-list">
            <div 
              v-for="change in configHistory" 
              :key="change.id"
              class="history-item"
            >
              <div class="history-time">{{ change.time }}</div>
              <div class="history-action">{{ change.action }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Hot Reload Info Dialog -->
    <el-dialog v-model="showHotReloadInfo" title="Hot Reload Configuration" width="500px">
      <div class="hot-reload-info">
        <el-alert title="Hot Reload Activé" type="success" :closable="false">
          <template #default>
            Les changements de configuration sont appliqués automatiquement sans redémarrage.
            Le système valide les modifications avant application.
          </template>
        </el-alert>
        
        <div style="margin-top: 16px;">
          <h4>Avantages :</h4>
          <ul>
            <li>⏱️ Zéro temps d'arrêt</li>
            <li>🔄 Application immédiate des changements</li>
            <li>✅ Validation automatique</li>
            <li>🔙 Rollback automatique en cas d'erreur</li>
          </ul>
        </div>
      </div>
      
      <template #footer>
        <el-button type="primary" @click="showHotReloadInfo = false">
          Compris
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  DocumentChecked, 
  Refresh, 
  Lightning, 
  FolderOpened, 
  Check, 
  Close,
  Monitor,
  Delete,
  Download
} from '@element-plus/icons-vue'

// Reactive data
const activeTab = ref('general')
const isSaving = ref(false)
const isValidating = ref(false)
const showHotReloadInfo = ref(false)
const isRunningDiagnostics = ref(false)
const isClearingLogs = ref(false)
const isApplyingConfig = ref(false)

// CORS origins string (for textarea editing)
const corsOrigins = ref('http://localhost:8080, http://localhost:3000')

// Configuration data (would come from API/store)
const config = ref({
  general: {
    execution_mode: 'gui',
    base_port: 8585,
    concurrent_runners: 1,
    auto_validation: true,
    verbose_logging: false
  },
  models: {
    auto_discovery: {
      enabled: true,
      base_path: 'F:/llm/llama/models',
      auto_update: false
    },
    global_parameters: {
      ctx_size: 16000,
      n_gpu_layers: 50,
      temp: 0.6,
      top_p: 0.95,
      top_k: 20,
      repeat_penalty: 1.2,
      batch_size: 2048,
      threads: 6
    }
  },
  proxy: {
    lmstudio: {
      enabled: true,
      port: 1234,
      api_key: null,
      cors_enabled: true
    },
    ollama: {
      enabled: true,
      port: 11434,
      base_url: 'http://localhost:11434',
      audio_enabled: true
    }
  },
  audio: {
    enabled: true,
    models: {
      'whisper-tiny': {
        enabled: true,
        model_path: 'tiny',
        parameters: {
          device: 'cpu',
          compute_type: 'int8',
          threads: 4,
          language: null,
          beam_size: 5
        }
      },
      'whisper-base': {
        enabled: true,
        model_path: 'base',
        parameters: {
          device: 'cpu',
          compute_type: 'int8',
          threads: 6,
          language: null,
          beam_size: 5
        }
      }
    }
  },
  security: {
    authentication: {
      enabled: false
    },
    api_key_required: false,
    rate_limit: {
      requests_per_minute: 100
    },
    monitoring: {
      enabled: true,
      health_check: true,
      health_endpoint: '/health'
    }
  },
  debug: {
    enabled: false,
    detailed_logs: false,
    log_level: 'INFO',
    console_logs: true,
    profiling_enabled: false,
    real_time_metrics: false,
    memory_monitoring: false,
    auto_tests: false,
    strict_validation: false,
    mock_mode: false,
    hot_reload: true,
    source_maps: true,
    devtools_integration: true,
    num_workers: 4,
    max_memory_mb: 4096,
    timeout_seconds: 30,
    auto_save: true,
    auto_save_interval: 300,
    export_formats: ['json', 'yaml']
  }
})

// Configuration history
const configHistory = ref([
  {
    id: 1,
    time: '14:30:25',
    action: 'Paramètres audio modifiés'
  },
  {
    id: 2,
    time: '14:25:12',
    action: 'Proxy LM Studio activé'
  },
  {
    id: 3,
    time: '14:20:45',
    action: 'Configuration rechargée'
  }
])

// Computed properties
const configStatus = computed(() => {
  const validModels = Object.keys(config.value.audio.models).length
  const activeProxies = Object.values(config.value.proxy)
    .filter(p => p.enabled).length
  
  if (validModels > 0 && activeProxies > 0) {
    return { type: 'success', text: 'Valide' }
  } else if (validModels > 0 || activeProxies > 0) {
    return { type: 'warning', text: 'Partielle' }
  } else {
    return { type: 'danger', text: 'Incomplète' }
  }
})

const modelCount = computed(() => {
  return Object.keys(config.value.audio.models).length
})

const activeProxiesCount = computed(() => {
  return Object.values(config.value.proxy).filter(p => p.enabled).length
})

// Methods
const saveConfig = async () => {
  isSaving.value = true
  
  try {
    // Update CORS origins from textarea
    config.value.security.cors_origins = corsOrigins.value.split(',').map(s => s.trim())
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Add to history
    configHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString('fr-FR'),
      action: 'Configuration sauvegardée'
    })
    
    ElMessage.success('Configuration sauvegardée avec succès')
  } catch (error) {
    ElMessage.error('Erreur lors de la sauvegarde')
  } finally {
    isSaving.value = false
  }
}

const reloadConfig = async () => {
  try {
    // Simulate config reload
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('Configuration rechargée')
    
    configHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString('fr-FR'),
      action: 'Configuration rechargée'
    })
  } catch (error) {
    ElMessage.error('Erreur lors du rechargement')
  }
}

const validateConfig = async () => {
  isValidating.value = true
  
  try {
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('Configuration valide')
  } catch (error) {
    ElMessage.error('Configuration invalide')
  } finally {
    isValidating.value = false
  }
}

const resetToDefaults = () => {
  ElMessageBox.confirm(
    'Voulez-vous really réinitialiser la configuration aux valeurs par défaut ?',
    'Confirmer la réinitialisation',
    {
      confirmButtonText: 'Réinitialiser',
      cancelButtonText: 'Annuler',
      type: 'warning',
    }
  ).then(() => {
    // Reset to defaults logic here
    ElMessage.success('Configuration réinitialisée')
  }).catch(() => {
    ElMessage.info('Réinitialisation annulée')
  })
}

const browseModelPath = () => {
  console.log('Opening folder browser...')
}

// Debug methods
const formatSeconds = (value) => {
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const runDiagnostics = async () => {
  isRunningDiagnostics.value = true
  
  try {
    // Simulate diagnostics run
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Add to history
    configHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString('fr-FR'),
      action: 'Diagnostics lancés'
    })
    
    ElMessage.success('Diagnostics terminés avec succès')
  } catch (error) {
    ElMessage.error('Erreur lors des diagnostics')
  } finally {
    isRunningDiagnostics.value = false
  }
}

const clearLogs = async () => {
  isClearingLogs.value = true
  
  try {
    // Simulate log clearing
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Add to history
    configHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString('fr-FR'),
      action: 'Logs effacés'
    })
    
    ElMessage.success('Logs effacés avec succès')
  } catch (error) {
    ElMessage.error('Erreur lors de l\'effacement des logs')
  } finally {
    isClearingLogs.value = false
  }
}

const exportDebugInfo = () => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    config: config.value,
    debug: {
      enabled: config.value.debug.enabled,
      features: Object.keys(config.value.debug).filter(key => config.value.debug[key] === true),
      environment: navigator.userAgent,
      url: window.location.href
    },
    system: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled
    }
  }
  
  const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { 
    type: 'application/json' 
  })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-info-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  // Add to history
  configHistory.value.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('fr-FR'),
    action: 'Informations debug exportées'
  })
  
  ElMessage.success('Informations debug exportées')
}

const applyDebugConfig = async () => {
  isApplyingConfig.value = true
  
  try {
    // Apply debug configuration changes
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Add to history
    configHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString('fr-FR'),
      action: 'Configuration debug appliquée'
    })
    
    ElMessage.success('Configuration debug appliquée avec succès')
  } catch (error) {
    ElMessage.error('Erreur lors de l\'application de la configuration')
  } finally {
    isApplyingConfig.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Load current config from API
  console.log('Loading configuration...')
})
</script>

<style lang="scss" scoped>
.config-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-header {
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

.config-tabs {
  flex: 1;
}

.tab-content {
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
}

.form-help {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.proxy-card {
  margin-bottom: 20px;
}

.proxy-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .proxy-icon {
    width: 20px;
    height: 20px;
  }
}

.audio-models {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.audio-model-card {
  .model-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .model-name {
      font-weight: 500;
      color: #303133;
    }
  }
}

.summary-card {
  height: fit-content;
}

.summary-content {
  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .summary-label {
      font-size: 14px;
      color: #909399;
    }

    .summary-value {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
  }
}

.summary-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.history-card {
  .history-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .history-item {
    padding: 8px 0;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .history-time {
      font-size: 12px;
      color: #909399;
    }

    .history-action {
      font-size: 14px;
      color: #303133;
    }
  }
}

.hot-reload-info {
  h4 {
    margin: 16px 0 8px 0;
    color: #303133;
  }

  ul {
    margin: 0;
    padding-left: 16px;

    li {
      margin-bottom: 4px;
      color: #606266;
    }
  }
}

.debug-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 20px 0;
  
  .el-button {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

// Responsive design
@media (max-width: 1200px) {
  .tab-content {
    padding: 15px;
  }
  
  .audio-models {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .config-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
  
  .tab-content {
    padding: 10px;
  }
  
  .summary-card,
  .history-card {
    margin-top: 20px;
  }
}
</style>