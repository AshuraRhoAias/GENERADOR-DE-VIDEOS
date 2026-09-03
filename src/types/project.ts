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
  type: 'torusKnot' | 'sphereKnot' | 'heart' | 'fire' | 'gearHeart'
  /** 'solid' = deforming mesh + wireframe overlay. 'particles' = glowing particle cloud. */
  style: 'solid' | 'particles'
  colorA: string
  colorB: string
  wireframeColor: string
  knotP: number
  knotQ: number
  reactTo: 'bass' | 'mid' | 'treble'
}

/** A HeroShape scheduled to appear only during [start, end) on the timeline. */
export interface ShapeBlock {
  id: string
  start: number
  end: number
  type: HeroShapeConfig['type']
  style: HeroShapeConfig['style']
  colorA: string
  colorB: string
  wireframeColor: string
  knotP: number
  knotQ: number
  reactTo: HeroShapeConfig['reactTo']
}

export interface Spectrum3DConfig {
  enabled: boolean
  bars: number
  colorA: string
  colorB: string
  reactTo: 'bass' | 'mid' | 'treble'
  motionEffect: 'bounce' | 'wave' | 'pulse' | 'spiral'
  scale: number
  posX: number
  posY: number
  glow: boolean
}

export interface PostProcessingConfig {
  bloom: {
    enabled: boolean
    intensity: number   // 0–3
    radius: number      // 0–1
    threshold: number   // 0–1
  }
  glitch: {
    enabled: boolean
    frequency: number   // 0–1 (how often)
    intensity: number   // 0–1
    onKick: boolean     // only fire on kick
  }
  colorGrade: {
    enabled: boolean
    saturation: number  // 0–3 (1 = normal)
    contrast: number    // 0–3 (1 = normal)
    brightness: number  // 0–2 (1 = normal)
    vignette: number    // 0–1
  }
}

export interface MediaAsset {
  id: string
  name: string
  type: 'image' | 'video'
  objectUrl: string   // from URL.createObjectURL — runtime only
  /** horizontal offset in % of canvas width, 0 = center */
  x: number
  /** vertical offset in % of canvas height, 0 = center */
  y: number
  /** width as % of canvas width */
  width: number
  rotation: number    // degrees
  opacity: number     // 0–1
  blendMode: string   // CSS mix-blend-mode
  zIndex: number
  fit: 'contain' | 'cover' | 'fill'
  loop: boolean
  muted: boolean
  audioReactive: {
    band: 'bass' | 'mid' | 'treble'
    property: 'scale' | 'opacity'
    amount: number
  } | null
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
  shapeTimeline: ShapeBlock[]
  spectrum3d: Spectrum3DConfig
  postProcessing: PostProcessingConfig
  mediaAssets: MediaAsset[]
  tracks: Track[]
}
