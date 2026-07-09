import { Film, Music, Layers, Sparkles, Box, Type } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useEditorStore } from '@/store/editorStore'
import { LyricsEditor } from './LyricsEditor'

const tabs = [
  { id: 'layers', label: 'Capas' },
  { id: 'lyrics', label: 'Letras' },
  { id: 'assets', label: 'Assets' },
] as const

const layerItems = [
  { icon: Film, label: 'Fondo', color: 'text-blue-400' },
  { icon: Sparkles, label: 'Partículas', color: 'text-violet-400' },
  { icon: Type, label: 'Letras', color: 'text-green-400' },
  { icon: Box, label: 'Modelos 3D', color: 'text-orange-400' },
]

export function LayersPanel() {
  const { openProject } = useProjectStore()
  const { leftPanelTab, setLeftPanelTab } = useEditorStore()

  return (
    <div className="flex flex-col h-full bg-[#111118] border-r border-white/8">
      {/* Tabs */}
      <div className="flex border-b border-white/8 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setLeftPanelTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              leftPanelTab === t.id
                ? 'text-white border-b border-violet-500'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {leftPanelTab === 'layers' && (
          <div className="p-2 flex flex-col gap-0.5">
            {layerItems.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
              >
                <Icon size={14} className={color} />
                <span className="text-xs text-white/60 group-hover:text-white transition-colors">{label}</span>
              </div>
            ))}
          </div>
        )}

        {leftPanelTab === 'lyrics' && <LyricsEditor />}

        {leftPanelTab === 'assets' && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Layers size={24} className="text-white/15 mb-3" />
            <p className="text-xs text-white/25">Sin assets</p>
            <p className="text-xs text-white/15 mt-1">Arrastra imágenes, audio o modelos 3D aquí</p>
          </div>
        )}
      </div>

      {/* Audio info */}
      {leftPanelTab === 'layers' && (
        <div className="border-t border-white/8 p-3 shrink-0">
          <div className="flex items-center gap-2 bg-white/4 rounded-lg px-3 py-2">
            <Music size={13} className="text-violet-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-white/50 truncate">
                {openProject?.audio?.localPath
                  ? openProject.audio.localPath.split('/').pop()
                  : 'Sin audio'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
