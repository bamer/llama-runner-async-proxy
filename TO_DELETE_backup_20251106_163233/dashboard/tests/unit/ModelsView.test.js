import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardView from '@/views/DashboardView.vue'

// Mock Chart.js
vi.mock('vue-chartjs', () => ({
  Line: {
    name: 'Line',
    template: '<div data-testid="line-chart"></div>'
  }
}))

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElCard: {
    name: 'ElCard',
    template: '<div><slot></slot></div>'
  },
  ElButton: {
    name: 'ElButton',
    template: '<button><slot></slot></button>',
    props: ['type', 'loading']
  },
  ElTag: {
    name: 'ElTag',
    template: '<span><slot></slot></span>',
    props: ['type']
  },
  ElRow: {
    name: 'ElRow',
    template: '<div><slot></slot></div>'
  },
  ElCol: {
    name: 'ElCol',
    template: '<div><slot></slot></div>',
    props: ['span']
  },
  ElTimeline: {
    name: 'ElTimeline',
    template: '<div><slot></slot></div>'
  },
  ElTimelineItem: {
    name: 'ElTimelineItem',
    template: '<div><slot></slot></div>',
    props: ['timestamp', 'type', 'color']
  }
}))

describe('DashboardView.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(DashboardView)
  })

  it('rend le dashboard correctement', () => {
    expect(wrapper.find('h2').text()).toBe('Gestion des Modèles')
  })

  it('affiche les statistiques initiales', () => {
    const statsCards = wrapper.findAll('[data-testid="stat-card"]')
    expect(statsCards.length).toBeGreaterThan(0)
  })

  it('gère la recherche de modèles', async () => {
    const searchInput = wrapper.find('input[placeholder="Rechercher un modèle..."]')
    await searchInput.setValue('Qwen')
    
    expect(searchInput.element.value).toBe('Qwen')
  })

  it('ouvre le dialog d\'ajout de modèle', async () => {
    const addButton = wrapper.find('button:contains("Ajouter Modèle")')
    await addButton.trigger('click')
    
    expect(wrapper.find('.el-dialog').exists()).toBe(true)
  })

  it('filtre les modèles par statut', async () => {
    const statusFilter = wrapper.find('select[placeholder="Statut"]')
    await statusFilter.setValue('active')
    
    // Vérifier que le filtre est appliqué
    expect(wrapper.vm.statusFilter).toBe('active')
  })

  it('gère les actions sur les modèles', async () => {
    const modelActions = wrapper.findAll('[data-testid="model-action"]')
    expect(modelActions.length).toBeGreaterThan(0)
  })

  it('valide le formulaire d\'ajout de modèle', async () => {
    const addButton = wrapper.find('button:contains("Ajouter Modèle")')
    await addButton.trigger('click')
    
    const dialog = wrapper.find('.el-dialog')
    expect(dialog.exists()).toBe(true)
    
    // Tester validation du formulaire
    const submitButton = dialog.find('button:contains("Ajouter")')
    await submitButton.trigger('click')
    
    // Should show validation errors for empty required fields
    const form = wrapper.findComponent({ name: 'ElForm' })
    expect(form.exists()).toBe(true)
  })

  it('calcule correctement le nombre de modèles filtrés', async () => {
    // Initial state
    expect(wrapper.vm.filteredModels).toHaveLength(2)
    
    // Apply search filter
    const searchInput = wrapper.find('input[placeholder="Rechercher un modèle..."]')
    await searchInput.setValue('Qwen')
    
    // Vue update
    await wrapper.vm.$nextTick()
    
    // Should filter to only Qwen models
    const filtered = wrapper.vm.filteredModels
    expect(filtered.every(model => model.display_name.includes('Qwen'))).toBe(true)
  })

  it('gère les erreurs lors de l\'ajout de modèle', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock API failure
    global.fetch = vi.fn(() => 
      Promise.reject(new Error('Network error'))
    )
    
    const addButton = wrapper.find('button:contains("Ajouter Modèle")')
    await addButton.trigger('click')
    
    const form = wrapper.findComponent({ name: 'ElForm' })
    await form.vm.validate(false)
    
    // Should handle error gracefully
    expect(consoleSpy).toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })

  it('affiche le bon type de tag selon le statut', () => {
    const getStatusTagType = wrapper.vm.getStatusTagType
    expect(getStatusTagType('active')).toBe('success')
    expect(getStatusTagType('inactive')).toBe('info')
    expect(getStatusTagType('loading')).toBe('warning')
    expect(getStatusTagType('error')).toBe('danger')
  })

  it('confirme avant suppression d\'un modèle', async () => {
    // Mock ElMessageBox
    global.ElMessageBox = {
      confirm: vi.fn(() => Promise.resolve()),
      success: vi.fn(),
      info: vi.fn()
    }
    
    const deleteButton = wrapper.find('button[title="Supprimer"]')
    await deleteButton.trigger('click')
    
    expect(global.ElMessageBox.confirm).toHaveBeenCalled()
  })
})