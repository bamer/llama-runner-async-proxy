import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProxyView from '@/views/ProxyView.vue'

// Mock Element Plus components
vi.mock('element-plus', () => ({
  ElCard: {
    name: 'ElCard',
    template: '<div><slot></slot></div>'
  },
  ElButton: {
    name: 'ElButton',
    template: '<button><slot></slot></button>',
    props: ['type', 'loading', 'disabled']
  },
  ElInput: {
    name: 'ElInput',
    template: '<div><slot></slot></div>',
    props: ['modelValue', 'placeholder', 'type']
  },
  ElSwitch: {
    name: 'ElSwitch',
    template: '<input type="checkbox"><slot></slot>',
    props: ['modelValue', 'disabled']
  },
  ElSelect: {
    name: 'ElSelect',
    template: '<div><slot></slot></div>',
    props: ['modelValue', 'placeholder']
  },
  ElOption: {
    name: 'ElOption',
    template: '<option><slot></slot></option>',
    props: ['label', 'value']
  },
  ElForm: {
    name: 'ElForm',
    template: '<div><slot></slot></div>',
    props: ['model', 'rules'],
    methods: ['validate', 'resetFields']
  },
  ElFormItem: {
    name: 'ElFormItem',
    template: '<div><slot></slot></div>',
    props: ['prop', 'label']
  },
  ElProgress: {
    name: 'ElProgress',
    template: '<div><slot></slot></div>',
    props: ['percentage', 'status', 'type']
  },
  ElTag: {
    name: 'ElTag',
    template: '<span><slot></slot></span>',
    props: ['type']
  },
  ElAlert: {
    name: 'ElAlert',
    template: '<div><slot></slot></div>',
    props: ['title', 'type', 'show-icon', 'closable']
  },
  ElTable: {
    name: 'ElTable',
    template: '<div><slot></slot></div>',
    props: ['data']
  },
  ElTableColumn: {
    name: 'ElTableColumn',
    template: '<div><slot></slot></div>',
    props: ['prop', 'label', 'width']
  }
}))

describe('ProxyView.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(ProxyView)
  })

  it('rend la vue proxy avec titre', () => {
    expect(wrapper.find('h2').text()).toBe('Configuration Proxy')
  })

  it('active/désactive le proxy', async () => {
    const proxySwitch = wrapper.findComponent({ name: 'ElSwitch' })
    await proxySwitch.vm.$emit('update:modelValue', true)
    expect(wrapper.vm.isProxyEnabled).toBe(true)
  })

  it('configure le port du proxy', async () => {
    const portInput = wrapper.findComponent({ name: 'ElInput', props: { placeholder: 'Port' }})
    await portInput.vm.$emit('update:modelValue', '8080')
    expect(wrapper.vm.proxyPort).toBe('8080')
  })

  it('valide le port du proxy', () => {
    const validPort = '8080'
    const invalidPort = '70000'
    
    expect(wrapper.vm.isValidPort(validPort)).toBe(true)
    expect(wrapper.vm.isValidPort(invalidPort)).toBe(false)
  })

  it('sauvegarde la configuration proxy', async () => {
    const saveButton = wrapper.find('button:contains("Sauvegarder")')
    await saveButton.trigger('click')
    
    // Should save the current proxy configuration
    expect(wrapper.vm.hasUnsavedChanges).toBe(false)
  })

  it('applique les paramètres par défaut', async () => {
    const defaultButton = wrapper.find('button:contains("Défaut")')
    await defaultButton.trigger('click')
    
    expect(wrapper.vm.proxyPort).toBe('8585')
    expect(wrapper.vm.isProxyEnabled).toBe(true)
  })

  it('teste la connectivité proxy', async () => {
    const testButton = wrapper.find('button:contains("Tester")')
    await testButton.trigger('click')
    
    // Should attempt to connect to the proxy
    expect(wrapper.vm.isTestingConnection).toBe(true)
  })

  it('affiche l\'état de connexion', () => {
    wrapper.vm.proxyStatus = 'connected'
    const statusTag = wrapper.findComponent({ name: 'ElTag' })
    expect(statusTag.exists()).toBe(true)
  })

  it('gère les erreurs de configuration', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock API failure
    global.fetch = vi.fn(() => 
      Promise.reject(new Error('Configuration error'))
    )
    
    const saveButton = wrapper.find('button:contains("Sauvegarder")')
    await saveButton.trigger('click')
    
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('affiche les logs proxy', () => {
    const logsTable = wrapper.findComponent({ name: 'ElTable' })
    expect(logsTable.exists()).toBe(true)
  })

  it('configure le timeout de requête', async () => {
    const timeoutInput = wrapper.find('input[placeholder="Timeout (secondes)"]')
    await timeoutInput.setValue('30')
    expect(wrapper.vm.requestTimeout).toBe('30')
  })

  it('active/désactive les logs détaillés', async () => {
    const detailedLogsSwitch = wrapper.findComponent({ name: 'ElSwitch' })
    await detailedLogsSwitch.vm.$emit('update:modelValue', true)
    expect(wrapper.vm.enableDetailedLogs).toBe(true)
  })

  it('recharge la configuration proxy', async () => {
    const reloadButton = wrapper.find('button:contains("Recharger")')
    await reloadButton.trigger('click')
    
    expect(wrapper.vm.isReloading).toBe(true)
  })

  it('exporte la configuration', async () => {
    const exportButton = wrapper.find('button:contains("Exporter")')
    await exportButton.trigger('click')
    
    // Should trigger a download of the configuration
    expect(wrapper.vm.isExporting).toBe(true)
  })

  it('importe une configuration', async () => {
    const fileInput = wrapper.find('input[type="file"]')
    const configFile = new File(['{"port": "8585"}'], 'config.json', { type: 'application/json' })
    
    await fileInput.trigger('change', {
      target: { files: [configFile] }
    })
    
    expect(wrapper.vm.importedConfig).toBeDefined()
  })

  it('valide la configuration importée', () => {
    const validConfig = {
      port: '8080',
      timeout: 30,
      detailedLogs: true
    }
    
    const invalidConfig = {
      port: 'abc',  // Invalid port
      timeout: -1   // Negative timeout
    }
    
    expect(wrapper.vm.isValidConfig(validConfig)).toBe(true)
    expect(wrapper.vm.isValidConfig(invalidConfig)).toBe(false)
  })

  it('affiche les alertes de sécurité', () => {
    const alert = wrapper.findComponent({ name: 'ElAlert' })
    expect(alert.exists()).toBe(true)
    expect(alert.props('type')).toBe('warning')
  })
})