export interface AudioReactiveData {
  bass: number
  mid: number
  treble: number
  kick: boolean
  beat: boolean
}

export interface ExportOptions {
  resolution: '720p' | '1080p' | '2K' | '4K'
  fps: 30 | 60
  format: 'mp4' | 'webm'
  watermark: boolean
}

export type PanelId = 'layers' | 'properties' | 'audio' | 'lyrics' | 'effects'

export interface UIState {
  leftPanel: PanelId
  rightPanel: PanelId
  timelineHeight: number
  isPlaying: boolean
  showExportModal: boolean
  showTemplateGallery: boolean
}
