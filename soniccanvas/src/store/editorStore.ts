import { create } from 'zustand'
import type { AudioReactiveData } from '@/types/editor'

interface EditorStore {
  isPlaying: boolean
  currentTime: number
  duration: number
  audioFile: File | null
  audioBuffer: AudioBuffer | null
  bpm: number
  audioReactive: AudioReactiveData
  showExportModal: boolean
  showTemplateGallery: boolean
  leftPanelTab: 'layers' | 'lyrics' | 'assets'
  rightPanelTab: 'properties' | 'audio' | 'effects'

  setPlaying: (v: boolean) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setAudioFile: (f: File | null) => void
  setAudioBuffer: (b: AudioBuffer | null) => void
  setBpm: (bpm: number) => void
  updateReactive: (data: AudioReactiveData) => void
  setShowExportModal: (v: boolean) => void
  setShowTemplateGallery: (v: boolean) => void
  setLeftPanelTab: (t: EditorStore['leftPanelTab']) => void
  setRightPanelTab: (t: EditorStore['rightPanelTab']) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  audioFile: null,
  audioBuffer: null,
  bpm: 120,
  audioReactive: { bass: 0, mid: 0, treble: 0, kick: false, beat: false },
  showExportModal: false,
  showTemplateGallery: false,
  leftPanelTab: 'layers',
  rightPanelTab: 'properties',

  setPlaying: (v) => set({ isPlaying: v }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setAudioFile: (f) => set({ audioFile: f }),
  setAudioBuffer: (b) => set({ audioBuffer: b }),
  setBpm: (bpm) => set({ bpm }),
  updateReactive: (data) => set({ audioReactive: data }),
  setShowExportModal: (v) => set({ showExportModal: v }),
  setShowTemplateGallery: (v) => set({ showTemplateGallery: v }),
  setLeftPanelTab: (t) => set({ leftPanelTab: t }),
  setRightPanelTab: (t) => set({ rightPanelTab: t }),
}))
