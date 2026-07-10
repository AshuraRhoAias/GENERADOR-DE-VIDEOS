import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Play, Pause, Square, Download,
  Save, Undo, Redo, Music2, Sliders, LayoutTemplate, Zap
} from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { Button } from '@/components/ui/Button'

export function Toolbar() {
  const navigate = useNavigate()
  const { isPlaying, setPlaying, setShowExportModal, setShowTemplateGallery, audioReactive, duration, currentTime } = useEditorStore()
  const { openProject, saveProject, isDirty } = useProjectStore()

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    return m + ':' + String(Math.floor(s % 60)).padStart(2, '0')
  }

  return (
    <div className="h-11 bg-[#0e0e16] border-b border-white/6 flex items-center px-3 gap-2 shrink-0">
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-white/35 hover:text-white/80 transition-colors text-xs pr-3 border-r border-white/8 mr-1 group"
      >
        <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="hidden sm:inline">Proyectos</span>
      </button>

      {/* Logo + title */}
      <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center shadow-[0_0_8px_rgba(124,58,237,0.5)]">
        <Music2 size={11} className="text-white" />
      </div>
      <span className="text-sm font-semibold text-white/70 max-w-[140px] truncate">
        {openProject?.title ?? 'Sin título'}
      </span>
      {isDirty && <span className="text-violet-400 text-xs">•</span>}

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 border-x border-white/8 px-2 mx-1">
        <button className="p-1.5 rounded hover:bg-white/5 text-white/25 hover:text-white/60 transition-colors" title="Deshacer">
          <Undo size={13} />
        </button>
        <button className="p-1.5 rounded hover:bg-white/5 text-white/25 hover:text-white/60 transition-colors" title="Rehacer">
          <Redo size={13} />
        </button>
      </div>

      {/* Playback */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPlaying(false)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/60 transition-colors"
          title="Detener"
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => setPlaying(!isPlaying)}
          className="w-8 h-7 rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-all shadow-[0_0_12px_rgba(124,58,237,0.35)] hover:shadow-[0_0_16px_rgba(124,58,237,0.5)]"
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
        </button>
      </div>

      {/* Time display */}
      <div className="hidden md:flex items-center gap-1 bg-white/4 border border-white/8 rounded-lg px-2.5 py-1 font-mono text-[11px]">
        <span className="text-white/70">{formatTime(currentTime)}</span>
        <span className="text-white/20">/</span>
        <span className="text-white/35">{formatTime(duration)}</span>
      </div>

      {/* Audio reactive indicator */}
      <div className="hidden lg:flex items-center gap-1 ml-1">
        {(['bass', 'mid', 'treble'] as const).map((band) => (
          <div key={band} className="flex flex-col-reverse gap-px">
            {Array.from({ length: 4 }, (_, j) => (
              <div
                key={j}
                className="w-1 h-1 rounded-sm transition-all duration-75"
                style={{
                  background: audioReactive[band] > (j / 4)
                    ? `rgba(167,139,250,${0.4 + j * 0.2})`
                    : 'rgba(255,255,255,0.06)'
                }}
              />
            ))}
          </div>
        ))}
        {audioReactive.kick && (
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping ml-0.5" />
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Templates */}
      <button
        onClick={() => setShowTemplateGallery(true)}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8"
        title="Templates"
      >
        <LayoutTemplate size={13} />
        <span className="hidden sm:inline">Templates</span>
      </button>

      {/* Props */}
      <button
        className="hidden lg:flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8"
        title="Propiedades"
      >
        <Sliders size={13} />
      </button>

      {/* Save */}
      <button
        onClick={saveProject}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8"
        title="Guardar (Ctrl+S)"
      >
        <Save size={13} />
        <span className="hidden sm:inline">Guardar</span>
      </button>

      {/* Export CTA */}
      <Button variant="primary" size="sm" onClick={() => setShowExportModal(true)}
        className="shadow-[0_0_12px_rgba(124,58,237,0.3)]">
        <Zap size={12} />
        <span className="hidden sm:inline">Exportar</span>
        <Download size={12} className="hidden sm:hidden" />
      </Button>
    </div>
  )
}
