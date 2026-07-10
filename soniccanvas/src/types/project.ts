export type ProjectStatus = 'draft' | 'published' | 'archived'

export interface ProjectMeta {
  id: string
  title: string
  thumbnailUrl: string | null
  durationSec: number
  templateId: string | null
  status: ProjectStatus
  createdAt: number
  updatedAt: number
}

export interface LyricLine {
  start: number
  end: number
  text: string
  translation?: string
}

export interface LyricStyle {
  fontFamily: string
  fontSize: number
  color: string
  glow: boolean
  glowColor: string
  animation: 'bounce' | 'fade' | 'slide' | 'karaoke'
  translationColor: string
  translationSize: number
}

export interface GLBObject {
  id: string
  url: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  audioReactive?: {
    bass?: { property: string; multiplier: number }
    kick?: { property: string; impulse: number }
  }
}

export interface ParticleConfig {
  enabled: boolean
  count: number
  reactTo: 'bass' | 'mid' | 'treble'
  color: string
  size: number
}

export interface HeroShapeConfig {
  enabled: boolean
  type: 'torusKnot' | 'sphereKnot'
  colorA: string
  colorB: string
  wireframeColor: string
  knotP: number
  knotQ: number
  reactTo: 'bass' | 'mid' | 'treble'
}

export interface Track {
  id: string
  name: string
  targetId: string
  property: string
  keyframes: Keyframe[]
}

export interface Keyframe {
  time: number
  value: number
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out'
}

export interface ProjectData {
  version: string
  id: string
  title: string
  template: string | null
  duration: number
  bpm: number
  audio: { url: string | null; localPath: string | null; offset: number }
  background: {
    type: 'color' | 'image' | 'video' | 'gradient'
    color?: string
    url?: string
    blur: number
    opacity: number
  }
  glbObjects: GLBObject[]
  lyrics: LyricLine[]
  lyricStyle: LyricStyle
  particles: ParticleConfig
  heroShape: HeroShapeConfig
  tracks: Track[]
}
