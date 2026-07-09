import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Play, Pause, Square, Download,
  Save, Undo, Redo, Music2, Layers, Sliders
} from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { Button } from '@/components/ui/Button'

export function Toolbar() {
  const navigate = useNavigate()
  const { isPlaying, setPlaying, setShowExportModal } = useEditorStore()
  const { openProject, saveProject, isDirty } = useProjectStore()

  return (
    <div className="h-11 bg-[#0e0e16] border-b border-white/8 flex items-center px-3 gap-2 shrink-0">
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-xs pr-3 border-r border-white/8 mr-1"
      >
        <ChevronLeft size={15} />
        <span className="hidden sm:inline">Proyectos</span>
      </button>

      {/* Logo */}
      <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center mr-1">
        <Music2 size={12} className="text-white" />
      </div>

      {/* Project title */}
      <span className="text-sm font-medium text-white/70 mr-auto truncate max-w-[180px]">
        {openProject?.title ?? 'Sin título'}
        {isDirty && <span className="text-violet-400 ml-1">•</span>}
      </span>

      {/* Edit controls */}
      <div className="flex items-center gap-0.5 border-r border-white/8 pr-2 mr-1">
        <button className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white transition-colors">
          <Undo size={14} />
        </button>
        <button className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white transition-colors">
          <Redo size={14} />
        </button>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-1 border-r border-white/8 pr-2 mr-1">
        <button
          onClick={() => setPlaying(false)}
          className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white transition-colors"
        >
          <Square size={14} />
        </button>
        <button
          onClick={() => setPlaying(!isPlaying)}
          className="w-8 h-7 rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors shadow-lg shadow-violet-900/30"
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
        </button>
      </div>

      {/* Panel toggles */}
      <div className="flex items-center gap-0.5 border-r border-white/8 pr-2 mr-1">
        <button className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white transition-colors" title="Capas">
          <Layers size={14} />
        </button>
        <button className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white transition-colors" title="Propiedades">
          <Sliders size={14} />
        </button>
      </div>

      {/* Save */}
      <button
        onClick={saveProject}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors px-2 py-1.5 rounded hover:bg-white/5"
      >
        <Save size={13} />
        <span className="hidden sm:inline">Guardar</span>
      </button>

      {/* Export */}
      <Button variant="primary" size="sm" onClick={() => setShowExportModal(true)}>
        <Download size={13} />
        <span className="hidden sm:inline">Exportar</span>
      </Button>
    </div>
  )
}
