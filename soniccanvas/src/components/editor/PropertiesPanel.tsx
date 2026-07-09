import { useProjectStore } from '@/store/projectStore'
import { useEditorStore } from '@/store/editorStore'
import { Sliders, Palette, Zap, Layers } from 'lucide-react'

const tabs = [
  { id: 'properties', label: 'Props' },
  { id: 'audio', label: 'Audio' },
  { id: 'effects', label: 'Efectos' },
] as const

function ColorSwatch({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="w-6 h-6 rounded-md border border-white/20 cursor-pointer" style={{ background: color }} />
      <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="sr-only" />
      <span className="text-xs text-white/40 font-mono">{color.toUpperCase()}</span>
    </label>
  )
}

function Knob({ label, value, min = 0, max = 1, step = 0.01, onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{label}</span>
        <span className="text-xs text-white/60 font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full accent-violet-500 cursor-pointer"
      />
    </div>
  )
}

export function PropertiesPanel() {
  const { openProject, updateOpenProject } = useProjectStore()
  const { rightPanelTab, setRightPanelTab, audioReactive } = useEditorStore()

  if (!openProject) return null

  const bg = openProject.background

  return (
    <div className="flex flex-col h-full bg-[#111118] border-l border-white/8">
      {/* Tabs */}
      <div className="flex border-b border-white/8 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setRightPanelTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              rightPanelTab === t.id
                ? 'text-white border-b border-violet-500'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'properties' && (
          <div className="p-3 flex flex-col gap-5">
            {/* Background section */}
            <section>
              <div className="flex items-center gap-1.5 mb-3">
                <Palette size={12} className="text-white/30" />
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Fondo</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-1.5">
                  {(['color', 'image', 'video'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateOpenProject({ background: { ...bg, type } })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                        bg.type === type
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/5 text-white/40 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {bg.type === 'color' && (
                  <ColorSwatch
                    color={bg.color ?? '#0a0a0f'}
                    onChange={(c) => updateOpenProject({ background: { ...bg, color: c } })}
                  />
                )}

                <Knob
                  label="Opacidad"
                  value={bg.opacity}
                  onChange={(v) => updateOpenProject({ background: { ...bg, opacity: v } })}
                />
                <Knob
                  label="Blur"
                  value={bg.blur}
                  min={0} max={20} step={0.5}
                  onChange={(v) => updateOpenProject({ background: { ...bg, blur: v } })}
                />
              </div>
            </section>

            {/* Lyrics style */}
            <section>
              <div className="flex items-center gap-1.5 mb-3">
                <Sliders size={12} className="text-white/30" />
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Letras</span>
              </div>
              <div className="flex flex-col gap-3">
                <Knob
                  label="Tamaño"
                  value={openProject.lyricStyle.fontSize}
                  min={16} max={120} step={1}
                  onChange={(v) => updateOpenProject({
                    lyricStyle: { ...openProject.lyricStyle, fontSize: v }
                  })}
                />
                <ColorSwatch
                  color={openProject.lyricStyle.color}
                  onChange={(c) => updateOpenProject({
                    lyricStyle: { ...openProject.lyricStyle, color: c }
                  })}
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openProject.lyricStyle.glow}
                    onChange={(e) => updateOpenProject({
                      lyricStyle: { ...openProject.lyricStyle, glow: e.target.checked }
                    })}
                    className="accent-violet-500"
                  />
                  <span className="text-xs text-white/50">Efecto glow</span>
                </label>
              </div>
            </section>
          </div>
        )}

        {rightPanelTab === 'audio' && (
          <div className="p-3 flex flex-col gap-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={12} className="text-white/30" />
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Audio Reactivo</span>
            </div>

            {(['bass', 'mid', 'treble'] as const).map((band) => (
              <div key={band} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40 capitalize">{band}</span>
                  <span className="text-xs font-mono text-white/60">
                    {(audioReactive[band] * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-75"
                    style={{ width: `${audioReactive[band] * 100}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="flex gap-2 mt-1">
              <div className={`flex-1 py-2 rounded-lg text-center text-xs font-medium transition-colors ${
                audioReactive.beat ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/20'
              }`}>
                Beat
              </div>
              <div className={`flex-1 py-2 rounded-lg text-center text-xs font-medium transition-colors ${
                audioReactive.kick ? 'bg-orange-600 text-white' : 'bg-white/5 text-white/20'
              }`}>
                Kick
              </div>
            </div>
          </div>
        )}

        {rightPanelTab === 'effects' && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Layers size={24} className="text-white/15 mb-3" />
            <p className="text-xs text-white/25">Efectos en Sprint 4</p>
            <p className="text-xs text-white/15 mt-1">Bloom · Glitch · Color grade</p>
          </div>
        )}
      </div>
    </div>
  )
}
