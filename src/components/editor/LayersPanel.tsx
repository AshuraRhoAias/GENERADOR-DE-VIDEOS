import { Film, Music, Sparkles, Box, Type, BarChart3 } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useEditorStore } from '@/store/editorStore'
import { LyricsEditor } from './LyricsEditor'
import type { Spectrum3DConfig } from '@/types/project'

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

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-violet-500' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-white/40 shrink-0">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  )
}

function Slider({ value, min, max, step = 1, onChange }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 accent-violet-500 cursor-pointer"
    />
  )
}

function ColorDot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="cursor-pointer">
      <span className="w-7 h-7 rounded-full border-2 border-white/20 block" style={{ background: value }} />
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="sr-only" />
    </label>
  )
}

function Chips<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
            value === o
              ? 'bg-violet-500/20 border-violet-500/60 text-violet-300'
              : 'border-white/10 text-white/30 hover:text-white/60'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function Spectrum3DPanel() {
  const { openProject, updateOpenProject } = useProjectStore()
  const cfg: Spectrum3DConfig = openProject?.spectrum3d ?? {
    enabled: false, bars: 16, colorA: '#7c3aed', colorB: '#fbbf24',
    reactTo: 'bass', motionEffect: 'bounce', scale: 1, posX: 0, posY: -1.5, glow: true,
  }

  const update = (patch: Partial<Spectrum3DConfig>) =>
    updateOpenProject({ spectrum3d: { ...cfg, ...patch } })

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2 bg-white/4 rounded-xl p-3 border border-white/8">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
          <BarChart3 size={15} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white/80">Espectro 3D</p>
          <p className="text-[10px] text-white/30">Visualizador de frecuencias</p>
        </div>
        <Toggle enabled={cfg.enabled} onChange={(v) => update({ enabled: v })} />
      </div>

      {/* Config — always visible so user can set it before enabling */}
      <div className="flex flex-col gap-3 px-1">
        {/* Colors */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Colores</p>
          <Row label="Color base">
            <div className="flex items-center gap-2">
              <ColorDot value={cfg.colorA} onChange={(v) => update({ colorA: v })} />
              <span className="text-[10px] text-white/30 font-mono">{cfg.colorA}</span>
            </div>
          </Row>
          <Row label="Color tope">
            <div className="flex items-center gap-2">
              <ColorDot value={cfg.colorB} onChange={(v) => update({ colorB: v })} />
              <span className="text-[10px] text-white/30 font-mono">{cfg.colorB}</span>
            </div>
          </Row>
        </div>

        {/* Bars */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Barras</p>
          <Row label={`Cantidad: ${cfg.bars}`}>
            <div className="w-28">
              <Slider value={cfg.bars} min={4} max={32} onChange={(v) => update({ bars: v })} />
            </div>
          </Row>
        </div>

        {/* React to */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Reactivo a</p>
          <Chips
            options={['bass', 'mid', 'treble'] as const}
            value={cfg.reactTo}
            onChange={(v) => update({ reactTo: v })}
          />
        </div>

        {/* Motion */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Efecto de movimiento</p>
          <Chips
            options={['bounce', 'wave', 'pulse', 'spiral'] as const}
            value={cfg.motionEffect}
            onChange={(v) => update({ motionEffect: v })}
          />
        </div>

        {/* Scale & position */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Tamaño y posición</p>
          <Row label={`Escala: ${cfg.scale.toFixed(1)}`}>
            <div className="w-28">
              <Slider value={cfg.scale} min={0.3} max={2.5} step={0.1} onChange={(v) => update({ scale: v })} />
            </div>
          </Row>
          <Row label={`Pos X: ${cfg.posX.toFixed(1)}`}>
            <div className="w-28">
              <Slider value={cfg.posX} min={-4} max={4} step={0.1} onChange={(v) => update({ posX: v })} />
            </div>
          </Row>
          <Row label={`Pos Y: ${cfg.posY.toFixed(1)}`}>
            <div className="w-28">
              <Slider value={cfg.posY} min={-4} max={4} step={0.1} onChange={(v) => update({ posY: v })} />
            </div>
          </Row>
        </div>

        {/* Glow */}
        <Row label="Glow">
          <Toggle enabled={cfg.glow} onChange={(v) => update({ glow: v })} />
        </Row>

        {/* Color preview */}
        <div
          className="h-8 rounded-lg"
          style={{ background: `linear-gradient(to right, ${cfg.colorA}, ${cfg.colorB})` }}
        />
      </div>
    </div>
  )
}

export function LayersPanel() {
  const { openProject } = useProjectStore()
  const { leftPanelTab, setLeftPanelTab } = useEditorStore()

  return (
    <div className="flex flex-col h-full bg-surface-2 border-r border-white/8">
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

        {leftPanelTab === 'assets' && <Spectrum3DPanel />}
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
