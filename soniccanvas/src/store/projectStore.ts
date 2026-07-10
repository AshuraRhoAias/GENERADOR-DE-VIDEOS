import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProjectMeta, ProjectData, HeroShapeConfig } from '@/types/project'

export const DEFAULT_HERO_SHAPE: HeroShapeConfig = {
  enabled: false,
  type: 'torusKnot',
  colorA: '#a855f7',
  colorB: '#22d3ee',
  wireframeColor: '#67e8f9',
  knotP: 2,
  knotQ: 5,
  reactTo: 'bass',
}

const defaultProject = (id: string, title: string): ProjectData => ({
  version: '1.0',
  id,
  title,
  template: null,
  duration: 0,
  bpm: 120,
  audio: { url: null, localPath: null, offset: 0 },
  background: { type: 'color', color: '#0a0a0f', blur: 0, opacity: 1 },
  glbObjects: [],
  lyrics: [],
  lyricStyle: {
    fontFamily: 'Inter',
    fontSize: 64,
    color: '#ffffff',
    glow: true,
    glowColor: '#7c3aed',
    animation: 'fade',
    translationColor: '#aaaaaa',
    translationSize: 32,
  },
  particles: { enabled: false, count: 300, reactTo: 'treble', color: '#ffffff', size: 0.05 },
  heroShape: { ...DEFAULT_HERO_SHAPE },
  shapeTimeline: [],
  tracks: [],
})

interface ProjectStore {
  projects: ProjectMeta[]
  openProject: ProjectData | null
  isDirty: boolean
  createProject: (title?: string) => ProjectMeta
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => ProjectMeta
  openProjectById: (id: string) => void
  closeProject: () => void
  updateOpenProject: (data: Partial<ProjectData>) => void
  saveProject: () => void
  projectsData: Record<string, ProjectData>
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      openProject: null,
      isDirty: false,
      projectsData: {},

      createProject: (title = 'Sin título') => {
        const id = 'proj_' + Date.now()
        const now = Date.now()
        const meta: ProjectMeta = {
          id,
          title,
          thumbnailUrl: null,
          durationSec: 0,
          templateId: null,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        }
        const data = defaultProject(id, title)
        set((s) => ({
          projects: [meta, ...s.projects],
          projectsData: { ...s.projectsData, [id]: data },
          openProject: data,
          isDirty: false,
        }))
        return meta
      },

      deleteProject: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.projectsData
          return {
            projects: s.projects.filter((p) => p.id !== id),
            projectsData: rest,
            openProject: s.openProject?.id === id ? null : s.openProject,
          }
        }),

      duplicateProject: (id) => {
        const src = get().projectsData[id]
        const srcMeta = get().projects.find((p) => p.id === id)
        if (!src || !srcMeta) throw new Error('Proyecto no encontrado')
        const newId = 'proj_' + Date.now()
        const now = Date.now()
        const newMeta: ProjectMeta = { ...srcMeta, id: newId, title: srcMeta.title + ' (copia)', createdAt: now, updatedAt: now }
        const newData: ProjectData = { ...src, id: newId, title: newMeta.title }
        set((s) => ({
          projects: [newMeta, ...s.projects],
          projectsData: { ...s.projectsData, [newId]: newData },
        }))
        return newMeta
      },

      openProjectById: (id) => {
        const data = get().projectsData[id]
        if (data) set({ openProject: data, isDirty: false })
      },

      closeProject: () => set({ openProject: null, isDirty: false }),

      updateOpenProject: (data) =>
        set((s) => ({
          openProject: s.openProject ? { ...s.openProject, ...data } : null,
          isDirty: true,
        })),

      saveProject: () => {
        const { openProject } = get()
        if (!openProject) return
        set((s) => ({
          isDirty: false,
          projectsData: { ...s.projectsData, [openProject.id]: openProject },
          projects: s.projects.map((p) =>
            p.id === openProject.id
              ? { ...p, title: openProject.title, durationSec: openProject.duration, updatedAt: Date.now() }
              : p
          ),
        }))
      },
    }),
    { name: 'soniccanvas-projects' }
  )
)
