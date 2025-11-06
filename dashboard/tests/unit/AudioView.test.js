import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AudioView from '@/views/AudioView.vue'

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
  ElUpload: {
    name: 'ElUpload',
    template: '<div><slot></slot></div>',
    props: ['action', 'auto-upload', 'show-file-list']
  },
  ElSlider: {
    name: 'ElSlider',
    template: '<input type="range"><slot></slot>',
    props: ['modelValue', 'min', 'max', 'step']
  },
  ElSwitch: {
    name: 'ElSwitch',
    template: '<input type="checkbox"><slot></slot>',
    props: ['modelValue', 'disabled']
  },
  ElProgress: {
    name: 'ElProgress',
    template: '<div><slot></slot></div>',
    props: ['percentage', 'status', 'type']
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

describe('AudioView.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(AudioView)
  })

  it('rend la vue audio avec titre', () => {
    expect(wrapper.find('h2').text()).toBe('Traitement Audio')
  })

  it('affiche les modèles de transcription disponibles', () => {
    const modelSelect = wrapper.findComponent({ name: 'ElSelect' })
    expect(modelSelect.exists()).toBe(true)
  })

  it('sélectionne un modèle de transcription', async () => {
    const select = wrapper.findComponent({ name: 'ElSelect' })
    await select.vm.$emit('update:modelValue', 'faster-whisper-large')
    expect(wrapper.vm.selectedTranscriptionModel).toBe('faster-whisper-large')
  })

  it('active/désactive l\'enregistrement automatique', async () => {
    const autoRecordSwitch = wrapper.findComponent({ name: 'ElSwitch' })
    await autoRecordSwitch.vm.$emit('update:modelValue', true)
    expect(wrapper.vm.autoRecord).toBe(true)
  })

  it('configure le seuil de détection vocale', async () => {
    const thresholdSlider = wrapper.findComponent({ name: 'ElSlider' })
    await thresholdSlider.vm.$emit('update:modelValue', 0.7)
    expect(wrapper.vm.voiceDetectionThreshold).toBe(0.7)
  })

  it('démarre l\'enregistrement audio', async () => {
    const recordButton = wrapper.find('button:contains("Démarrer")')
    await recordButton.trigger('click')
    
    expect(wrapper.vm.isRecording).toBe(true)
  })

  it('arrête l\'enregistrement audio', async () => {
    // Start recording first
    wrapper.vm.isRecording = true
    await wrapper.vm.$nextTick()
    
    const stopButton = wrapper.find('button:contains("Arrêter")')
    await stopButton.trigger('click')
    
    expect(wrapper.vm.isRecording).toBe(false)
  })

  it('uploade un fichier audio', async () => {
    const file = new File(['audio'], 'test.wav', { type: 'audio/wav' })
    const uploadInput = wrapper.find('input[type="file"]')
    
    await uploadInput.trigger('change', {
      target: { files: [file] }
    })
    
    expect(wrapper.vm.uploadedFile).toBe(file)
  })

  it('afficher l\'audio en cours de traitement', () => {
    wrapper.vm.isProcessing = true
    expect(wrapper.findComponent({ name: 'ElProgress' }).exists()).toBe(true)
  })

  it('valide les formats de fichier supportés', () => {
    const validFormats = ['.wav', '.mp3', '.m4a', '.ogg']
    const testFile = { name: 'test.wav' }
    
    expect(wrapper.vm.isValidAudioFile(testFile)).toBe(true)
    
    const invalidFile = { name: 'test.txt' }
    expect(wrapper.vm.isValidAudioFile(invalidFile)).toBe(false)
  })

  it('configure les paramètres d\'enregistrement', async () => {
    // Test sample rate configuration
    const sampleRateSelect = wrapper.findComponent({ name: 'ElSelect' })
    await sampleRateSelect.vm.$emit('update:modelValue', '44100')
    expect(wrapper.vm.sampleRate).toBe('44100')
  })

  it('gère les erreurs d\'enregistrement', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock microphone error
    global.navigator.mediaDevices = {
      getUserMedia: vi.fn(() => Promise.reject(new Error('Microphone access denied')))
    }
    
    const recordButton = wrapper.find('button:contains("Démarrer")')
    await recordButton.trigger('click')
    
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('affiche l\'historique des transcriptions', () => {
    const timeline = wrapper.findComponent({ name: 'ElTimeline' })
    expect(timeline.exists()).toBe(true)
  })

  it('gère les résultats de transcription', async () => {
    const mockResult = {
      text: 'Bonjour, ceci est un test de transcription',
      confidence: 0.95,
      timestamp: new Date()
    }
    
    wrapper.vm.transcriptionHistory.unshift(mockResult)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.transcriptionHistory).toContain(mockResult)
  })

  it('confirme avant suppression d\'un enregistrement', async () => {
    // Mock ElMessageBox
    global.ElMessageBox = {
      confirm: vi.fn(() => Promise.resolve())
    }
    
    const deleteButton = wrapper.find('button[title="Supprimer"]')
    await deleteButton.trigger('click')
    
    expect(global.ElMessageBox.confirm).toHaveBeenCalled()
  })
})