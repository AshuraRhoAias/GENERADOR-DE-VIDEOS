import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Toolbar } from '@/components/editor/Toolbar'
import { LayersPanel } from '@/components/editor/LayersPanel'
import { PropertiesPanel } from '@/components/editor/PropertiesPanel'
import { Timeline } from '@/components/editor/Timeline'
import { Viewport } from '@/components/canvas/Viewport'
import { ExportModal } from '@/components/editor/ExportModal'
import { TemplateGallery } from '@/components/editor/TemplateGallery'
import { useProjectStore } from '@/store/projectStore'
import { useEditorStore } from '@/store/editorStore'
import { useAudioReactive } from '@/hooks/useAudioReactive'
import { audioAnalyzer } from '@/lib/audioAnalyzer'

export function Editor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { openProject, openProjectById } = useProjectStore()

  useAudioReactive()

  useEffect(() => {
    if (id && (!openProject || openProject.id !== id)) {
      openProjectById(id)
    }
  }, [id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const editable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable

      // Ctrl+S — save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        useProjectStore.getState().saveProject()
        return
      }

      if (editable) return

      // Space — play / pause
      if (e.code === 'Space') {
        e.preventDefault()
        const store = useEditorStore.getState()
        if (!store.duration) return
        store.setPlaying(!store.isPlaying)
        return
      }

      // K — play / pause (alternate)
      if (e.key === 'k' || e.key === 'K') {
        const store = useEditorStore.getState()
        if (!store.duration) return
        store.setPlaying(!store.isPlaying)
        return
      }

      // J — rewind 5s
      if (e.key === 'j' || e.key === 'J') {
        const store = useEditorStore.getState()
        const t = Math.max(0, store.currentTime - 5)
        store.setCurrentTime(t)
        audioAnalyzer.seek(t)
        return
      }

      // L — forward 5s
      if (e.key === 'l' || e.key === 'L') {
        const store = useEditorStore.getState()
        const t = Math.min(store.duration, store.currentTime + 5)
        store.setCurrentTime(t)
        audioAnalyzer.seek(t)
        return
      }

      // Home — go to start
      if (e.key === 'Home') {
        e.preventDefault()
        const store = useEditorStore.getState()
        audioAnalyzer.stop()
        store.setPlaying(false)
        store.setCurrentTime(0)
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!openProject) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-0">
        <div className="text-center">
          <p className="text-white/30 text-sm mb-4">Proyecto no encontrado</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-surface-0 overflow-hidden select-none">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-52 shrink-0">
          <LayersPanel />
        </div>

        {/* Center: canvas + timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          <Viewport />
          <Timeline />
        </div>

        {/* Right panel */}
        <div className="w-56 shrink-0">
          <PropertiesPanel />
        </div>
      </div>

      <ExportModal />
      <TemplateGallery />
    </div>
  )
}
