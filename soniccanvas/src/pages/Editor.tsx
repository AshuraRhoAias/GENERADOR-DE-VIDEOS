import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Toolbar } from '@/components/editor/Toolbar'
import { LayersPanel } from '@/components/editor/LayersPanel'
import { PropertiesPanel } from '@/components/editor/PropertiesPanel'
import { Timeline } from '@/components/editor/Timeline'
import { Viewport } from '@/components/canvas/Viewport'
import { ExportModal } from '@/components/editor/ExportModal'
import { useProjectStore } from '@/store/projectStore'

export function Editor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { openProject, openProjectById } = useProjectStore()

  useEffect(() => {
    if (id && (!openProject || openProject.id !== id)) {
      openProjectById(id)
    }
  }, [id])

  useEffect(() => {
    // Save on Ctrl+S
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        useProjectStore.getState().saveProject()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!openProject) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
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
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
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
    </div>
  )
}
