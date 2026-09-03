import { useRef } from 'react'
import { Film, Music, Sparkles, Box, Type, BarChart3, ImagePlus, Video, Image, Trash2 } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useEditorStore } from '@/store/editorStore'
import { LyricsEditor } from './LyricsEditor'
import type { Spectrum3DConfig, MediaAsset } from '@/types/project'

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
      type="range" min={min} max={max} step={step} value={value}
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
            value === o ? 'bg-violet-500/20 border-violet-500/60 text-violet-300' : 'border-white/10 text-white/30 hover:text-white/60'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

// ——— Spectrum3D Panel ———
function Spectrum3DPanel() {
  const { openProject, updateOpenProject } = useProjectStore()
  const cfg: Spectrum3DConfig = openProject?.spectrum3d ?? {
    enabled: false, bars: 16, colorA: '#7c3aed', colorB: '#fbbf24',
    reactTo: 'bass', motionEffect: 'bounce', scale: 1, posX: 0, posY: -1.5, glow: true,
  }
  const update = (patch: Partial<Spectrum3DConfig>) => updateOpenProject({ spectrum3d: { ...cfg, ...patch } })

  return (
    <div className="flex flex-col gap-4 p-3 border-b border-white/8 pb-5">
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

      <div className="flex flex-col gap-3 px-1">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Colores</p>
        <Row label="Base"><div className="flex items-center gap-2"><ColorDot value={cfg.colorA} onChange={(v) => update({ colorA: v })} /><span className="text-[10px] text-white/30 font-mono">{cfg.colorA}</span></div></Row>
        <Row label="Tope"><div className="flex items-center gap-2"><ColorDot value={cfg.colorB} onChange={(v) => update({ colorB: v })} /><span className="text-[10px] text-white/30 font-mono">{cfg.colorB}</span></div></Row>

        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mt-1">Barras</p>
        <Row label={`Cantidad: ${cfg.bars}`}><div className="w-28"><Slider value={cfg.bars} min={4} max={32} onChange={(v) => update({ bars: v })} /></div></Row>

        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mt-1">Reactivo a</p>
        <Chips options={['bass', 'mid', 'treble'] as const} value={cfg.reactTo} onChange={(v) => update({ reactTo: v })} />

        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mt-1">Efecto de movimiento</p>
        <Chips options={['bounce', 'wave', 'pulse', 'spiral'] as const} value={cfg.motionEffect} onChange={(v) => update({ motionEffect: v })} />

        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mt-1">Tamaño y posición</p>
        <Row label={`Escala: ${cfg.scale.toFixed(1)}`}><div className="w-28"><Slider value={cfg.scale} min={0.3} max={2.5} step={0.1} onChange={(v) => update({ scale: v })} /></div></Row>
        <Row label={`Pos X: ${cfg.posX.toFixed(1)}`}><div className="w-28"><Slider value={cfg.posX} min={-4} max={4} step={0.1} onChange={(v) => update({ posX: v })} /></div></Row>
        <Row label={`Pos Y: ${cfg.posY.toFixed(1)}`}><div className="w-28"><Slider value={cfg.posY} min={-4} max={4} step={0.1} onChange={(v) => update({ posY: v })} /></div></Row>

        <Row label="Glow"><Toggle enabled={cfg.glow} onChange={(v) => update({ glow: v })} /></Row>
        <div className="h-8 rounded-lg" style={{ background: `linear-gradient(to right, ${cfg.colorA}, ${cfg.colorB})` }} />
      </div>
    </div>
  )
}

// ——— Media Assets Panel ———
function MediaPanel() {
  const { openProject, updateOpenProject } = useProjectStore()
  const { selectedMediaAssetId, setSelectedMediaAssetId } = useEditorStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaAssets = openProject?.mediaAssets ?? []

  const addAssets = (files: FileList | null) => {
    if (!files || !openProject) return
    const newAssets: MediaAsset[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
      .map((f) => ({
        id: 'media_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        name: f.name,
        type: f.type.startsWith('video/') ? 'video' : 'image',
        objectUrl: URL.createObjectURL(f),
        x: 0,
        y: 0,
        width: 40,
        rotation: 0,
        opacity: 1,
        blendMode: 'normal',
        zIndex: mediaAssets.length,
        fit: 'contain',
        loop: true,
        muted: true,
        audioReactive: null,
      }))
    updateOpenProject({ mediaAssets: [...mediaAssets, ...newAssets] })
    if (newAssets.length > 0) setSelectedMediaAssetId(newAssets[newAssets.length - 1].id)
  }

  const removeAsset = (id: string) => {
    updateOpenProject({ mediaAssets: mediaAssets.filter((a) => a.id !== id) })
    if (selectedMediaAssetId === id) setSelectedMediaAssetId(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addAssets(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Media (imagen / video)</p>

      {/* Drop zone / add button */}
      <div
        className="border border-dashed border-white/15 rounded-xl p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <ImagePlus size={18} className="text-white/20" />
        <p className="text-[10px] text-white/30">Haz clic o arrastra<br />imágenes y vídeos aquí</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="sr-only"
          onChange={(e) => addAssets(e.target.files)}
        />
      </div>

      {/* Asset list */}
      <div className="flex flex-col gap-1">
        {mediaAssets.map((asset) => {
          const selected = asset.id === selectedMediaAssetId
          const Icon = asset.type === 'video' ? Video : Image
          return (
            <div
              key={asset.id}
              onClick={() => setSelectedMediaAssetId(selected ? null : asset.id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${
                selected ? 'bg-violet-500/15 border border-violet-500/30' : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-8 h-8 rounded-md overflow-hidden bg-white/5 border border-white/10 shrink-0">
                {asset.type === 'image' && asset.objectUrl
                  ? <img src={asset.objectUrl} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center"><Icon size={12} className="text-white/30" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/60 truncate">{asset.name}</p>
                <p className="text-[9px] text-white/25">{asset.type} · {asset.width}% · {Math.round(asset.opacity * 100)}%op</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeAsset(asset.id) }}
                className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )
        })}
        {mediaAssets.length === 0 && (
          <p className="text-[10px] text-white/20 text-center py-2">Sin assets</p>
        )}
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
              leftPanelTab === t.id ? 'text-white border-b border-violet-500' : 'text-white/30 hover:text-white/60'
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
              <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                <Icon size={14} className={color} />
                <span className="text-xs text-white/60 group-hover:text-white transition-colors">{label}</span>
              </div>
            ))}
          </div>
        )}

        {leftPanelTab === 'lyrics' && <LyricsEditor />}

        {leftPanelTab === 'assets' && (
          <>
            <Spectrum3DPanel />
            <MediaPanel />
          </>
        )}
      </div>

      {/* Audio info */}
      {leftPanelTab === 'layers' && (
        <div className="border-t border-white/8 p-3 shrink-0">
          <div className="flex items-center gap-2 bg-white/4 rounded-lg px-3 py-2">
            <Music size={13} className="text-violet-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-white/50 truncate">
                {openProject?.audio?.localPath ? openProject.audio.localPath.split('/').pop() : 'Sin audio'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
