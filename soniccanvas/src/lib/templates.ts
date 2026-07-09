import type { ProjectData } from '@/types/project'

export interface Template {
  id: string
  name: string
  category: string
  description: string
  emoji: string
  isPremium: boolean
  config: Partial<ProjectData>
}

export const TEMPLATES: Template[] = [
  {
    id: 'neon-lyrics',
    name: 'Neon Lyrics',
    category: 'Hip-hop / Trap',
    description: 'Texto neón sobre fondo oscuro con glow violeta. Ideal para rap y trap.',
    emoji: '🟣',
    isPremium: false,
    config: {
      background: { type: 'color', color: '#05050a', blur: 0, opacity: 1 },
      lyricStyle: {
        fontFamily: 'Inter',
        fontSize: 72,
        color: '#ffffff',
        glow: true,
        glowColor: '#9f5fff',
        animation: 'bounce',
        translationColor: '#7c3aed',
        translationSize: 36,
      },
      particles: { enabled: true, count: 200, reactTo: 'treble', color: '#7c3aed', size: 0.04 },
    },
  },
  {
    id: 'space-visualizer',
    name: 'Space Visualizer',
    category: 'Electronic / Ambient',
    description: 'Galaxia de partículas con frecuencias reactivas. Perfecto para music art.',
    emoji: '🌌',
    isPremium: false,
    config: {
      background: { type: 'color', color: '#000510', blur: 0, opacity: 1 },
      lyricStyle: {
        fontFamily: 'Inter',
        fontSize: 56,
        color: '#c8e6ff',
        glow: true,
        glowColor: '#38bdf8',
        animation: 'fade',
        translationColor: '#7dd3fc',
        translationSize: 28,
      },
      particles: { enabled: true, count: 500, reactTo: 'bass', color: '#38bdf8', size: 0.03 },
    },
  },
  {
    id: 'phonk-glitch',
    name: 'Phonk Glitch',
    category: 'Phonk / Dark Trap',
    description: 'Rojo y negro con efecto glitch en los kicks. Brutal.',
    emoji: '💀',
    isPremium: false,
    config: {
      background: { type: 'color', color: '#0a0000', blur: 0, opacity: 1 },
      lyricStyle: {
        fontFamily: 'Inter',
        fontSize: 80,
        color: '#ff2020',
        glow: true,
        glowColor: '#ff0000',
        animation: 'slide',
        translationColor: '#ff6060',
        translationSize: 40,
      },
      particles: { enabled: true, count: 300, reactTo: 'bass', color: '#ff2020', size: 0.05 },
    },
  },
  {
    id: 'dark-cinematic',
    name: 'Dark Cinematic',
    category: 'R&B / Ballads',
    description: 'Cinematográfico con tones dorados. Elegante y oscuro.',
    emoji: '🎬',
    isPremium: true,
    config: {
      background: { type: 'color', color: '#080604', blur: 0, opacity: 1 },
      lyricStyle: {
        fontFamily: 'Inter',
        fontSize: 60,
        color: '#f5d98a',
        glow: true,
        glowColor: '#d4a017',
        animation: 'fade',
        translationColor: '#b8924e',
        translationSize: 30,
      },
      particles: { enabled: false, count: 100, reactTo: 'mid', color: '#f5d98a', size: 0.02 },
    },
  },
  {
    id: 'karaoke-clean',
    name: 'Karaoke Clean',
    category: 'Pop / J-pop',
    description: 'Letras limpias centradas con fondo blanco. Minimalista y fresco.',
    emoji: '🎤',
    isPremium: false,
    config: {
      background: { type: 'color', color: '#f0f0f8', blur: 0, opacity: 1 },
      lyricStyle: {
        fontFamily: 'Inter',
        fontSize: 64,
        color: '#1a1a2e',
        glow: false,
        glowColor: '#6366f1',
        animation: 'karaoke',
        translationColor: '#6366f1',
        translationSize: 32,
      },
      particles: { enabled: false, count: 0, reactTo: 'treble', color: '#6366f1', size: 0.02 },
    },
  },
  {
    id: 'lofi-rain',
    name: 'Lo-Fi Rain',
    category: 'Lo-fi / Chill',
    description: 'Colores pasteles con efecto lluvia. Perfecto para chill beats.',
    emoji: '🌧️',
    isPremium: true,
    config: {
      background: { type: 'color', color: '#1a1a2e', blur: 0, opacity: 1 },
      lyricStyle: {
        fontFamily: 'Inter',
        fontSize: 52,
        color: '#fde8d8',
        glow: true,
        glowColor: '#f9a8d4',
        animation: 'fade',
        translationColor: '#fbcfe8',
        translationSize: 26,
      },
      particles: { enabled: true, count: 400, reactTo: 'treble', color: '#93c5fd', size: 0.02 },
    },
  },
  {
    id: 'cyberpunk-city',
    name: 'Cyberpunk City',
    category: 'Synthwave / EDM',
    description: 'Ciudad futurista con neón cyan y magenta. Alta energía.',
    emoji: '🌆',
    isPremium: true,
    config: {
      background: { type: 'color', color: '#030010', blur: 0, opacity: 1 },
      lyricStyle: {
        fontFamily: 'Inter',
        fontSize: 70,
        color: '#00ffff',
        glow: true,
        glowColor: '#ff00ff',
        animation: 'slide',
        translationColor: '#ff00ff',
        translationSize: 35,
      },
      particles: { enabled: true, count: 600, reactTo: 'bass', color: '#00ffff', size: 0.04 },
    },
  },
]
