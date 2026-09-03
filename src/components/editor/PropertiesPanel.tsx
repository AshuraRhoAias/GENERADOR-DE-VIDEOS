import { useProjectStore, DEFAULT_HERO_SHAPE, DEFAULT_POST_PROCESSING } from '@/store/projectStore'
import { useEditorStore } from '@/store/editorStore'
import {
  Palette, Zap, Sparkles, Type, Orbit, Clock, Trash2,
  Image, Video, Layers, type LucideIcon
} from 'lucide-react'
import type { HeroShapeConfig, ShapeBlock, MediaAsset, PostProcessingConfig } from '@/types/project'

function formatBlockTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const tabs = [
  { id: 'properties', label: 'Props' },
  { id: 'audio', label: 'Audio' },
  { id: 'effects', label: 'Efectos' },
] as const

function SectionHeader({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <Icon size={11} className="text-white/30" />
      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">{label}</span>
    </div>
  )
}

function ColorSwatch({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className="w-6 h-6 rounded-md border border-white/20 group-hover:border-white/40 transition-colors shrink-0" style={{ background: color }} />
      <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="sr-only" />
      <span className="text-xs text-white/40 font-mono group-hover:text-white/60 transition-colors">{color.toUpperCase()}</span>
    </label>
  )
}

function Knob({ label, value, min = 0, max = 1, step = 0.01, unit = '', onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number; unit?: string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{label}</span>
        <span className="text-xs text-white/50 font-mono">
          {Number.isInteger(step) || step >= 1 ? Math.round(value) : value.toFixed(2)}{unit}
        </span>
      </div>
      <div className="relative h-1 bg-white/8 rounded-full">
        <div className="absolute left-0 top-0 h-full bg-violet-500 rounded-full pointer-events-none" style={{ width: `${pct}%` }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">{label}</span>
      <button
        type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-4 rounded-full transition-colors disabled:cursor-not-allowed ${checked ? 'bg-violet-600' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  )
}

function SegmentedControl<T extends string>({ options, value, onChange, wrap }: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
  wrap?: boolean
}) {
  return (
    <div className={`flex gap-1 bg-white/4 rounded-lg p-0.5 ${wrap ? 'flex-wrap' : ''}`}>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`${wrap ? 'flex-1 min-w-[30%]' : 'flex-1'} py-1 rounded-md text-xs font-medium transition-all ${
            value === o.id ? 'bg-violet-600 text-white shadow' : 'text-white/35 hover:text-white/60'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

type ShapeFieldsValue = Omit<HeroShapeConfig, 'enabled'>
function ShapeFields({ value, onChange }: { value: ShapeFieldsValue; onChange: (patch: Partial<ShapeFieldsValue>) => void }) {
  return (
    <>
      <div>
        <p className="text-xs text-white/35 mb-2">Figura</p>
        <SegmentedControl value={value.type} wrap
          options={[
            { id: 'torusKnot', label: 'Nudo' }, { id: 'sphereKnot', label: 'Orbe' },
            { id: 'heart', label: 'Corazón' }, { id: 'fire', label: 'Fuego' }, { id: 'gearHeart', label: 'Mecánico' },
          ]}
          onChange={(type) => onChange({ type })}
        />
      </div>
      <div>
        <p className="text-xs text-white/35 mb-2">Estilo</p>
        <SegmentedControl value={value.style}
          options={[{ id: 'solid', label: 'Malla' }, { id: 'particles', label: 'Partículas' }]}
          onChange={(style) => onChange({ style })}
        />
      </div>
      <ColorSwatch color={value.colorA} onChange={(c) => onChange({ colorA: c })} />
      <ColorSwatch color={value.colorB} onChange={(c) => onChange({ colorB: c })} />
      {value.style === 'solid' && <ColorSwatch color={value.wireframeColor} onChange={(c) => onChange({ wireframeColor: c })} />}
      {(value.type === 'torusKnot' || value.type === 'sphereKnot') && (
        <>
          <Knob label="Complejidad (p)" value={value.knotP} min={2} max={5} step={1} onChange={(v) => onChange({ knotP: v })} />
          <Knob label="Complejidad (q)" value={value.knotQ} min={2} max={9} step={1} onChange={(v) => onChange({ knotQ: v })} />
        </>
      )}
      <div>
        <p className="text-xs text-white/35 mb-2">Reacciona a</p>
        <SegmentedControl value={value.reactTo}
          options={[{ id: 'bass', label: 'Bass' }, { id: 'mid', label: 'Mid' }, { id: 'treble', label: 'Treble' }]}
          onChange={(r) => onChange({ reactTo: r })}
        />
      </div>
    </>
  )
}

// ——— Media asset transform editor ———
function MediaAssetEditor({ asset, onUpdate, onDelete }: {
  asset: MediaAsset
  onUpdate: (patch: Partial<MediaAsset>) => void
  onDelete: () => void
}) {
  const Icon = asset.type === 'video' ? Video : Image
  const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'lighten', 'darken', 'color-dodge', 'color-burn', 'hard-light', 'soft-light']

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 bg-white/4 rounded-xl p-2.5 border border-white/8">
        <div className="w-8 h-8 rounded-md overflow-hidden bg-white/5 border border-white/10 shrink-0">
          {asset.type === 'image' && asset.objectUrl
            ? <img src={asset.objectUrl} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center"><Icon size={12} className="text-white/30" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-white/70 truncate">{asset.name}</p>
          <p className="text-[9px] text-white/30 capitalize">{asset.type}</p>
        </div>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Transform */}
      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Transformar</p>
      <Knob label={`Tamaño: ${asset.width}%`} value={asset.width} min={5} max={100} step={1} onChange={(v) => onUpdate({ width: v })} />
      <Knob label={`Pos X: ${asset.x.toFixed(0)}%`} value={asset.x} min={-100} max={100} step={1} onChange={(v) => onUpdate({ x: v })} />
      <Knob label={`Pos Y: ${asset.y.toFixed(0)}%`} value={asset.y} min={-100} max={100} step={1} onChange={(v) => onUpdate({ y: v })} />
      <Knob label={`Rotación: ${asset.rotation}°`} value={asset.rotation} min={-180} max={180} step={1} unit="°" onChange={(v) => onUpdate({ rotation: v })} />
      <Knob label="Opacidad" value={asset.opacity} min={0} max={1} step={0.01} onChange={(v) => onUpdate({ opacity: v })} />
      <Knob label={`Z-Index: ${asset.zIndex}`} value={asset.zIndex} min={0} max={20} step={1} onChange={(v) => onUpdate({ zIndex: v })} />

      {/* Fit */}
      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mt-1">Ajuste</p>
      <SegmentedControl
        value={asset.fit}
        options={[{ id: 'contain', label: 'Contener' }, { id: 'cover', label: 'Cubrir' }, { id: 'fill', label: 'Llenar' }]}
        onChange={(fit) => onUpdate({ fit })}
      />

      {/* Blend mode */}
      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mt-1">Mezcla</p>
      <select
        value={asset.blendMode}
        onChange={(e) => onUpdate({ blendMode: e.target.value })}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/60 focus:border-violet-500 focus:outline-none"
      >
        {BLEND_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      {/* Video options */}
      {asset.type === 'video' && (
        <>
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mt-1">Video</p>
          <Toggle label="Loop" checked={asset.loop} onChange={(v) => onUpdate({ loop: v })} />
          <Toggle label="Sin sonido" checked={asset.muted} onChange={(v) => onUpdate({ muted: v })} />
        </>
      )}

      {/* Audio reactive */}
      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mt-1">Audio reactivo</p>
      <Toggle
        label="Activar"
        checked={asset.audioReactive !== null}
        onChange={(v) => onUpdate({
          audioReactive: v ? { band: 'bass', property: 'scale', amount: 0.3 } : null
        })}
      />
      {asset.audioReactive && (
        <>
          <SegmentedControl
            value={asset.audioReactive.band}
            options={[{ id: 'bass', label: 'Bass' }, { id: 'mid', label: 'Mid' }, { id: 'treble', label: 'Treble' }]}
            onChange={(band) => onUpdate({ audioReactive: { ...asset.audioReactive!, band } })}
          />
          <SegmentedControl
            value={asset.audioReactive.property}
            options={[{ id: 'scale', label: 'Escala' }, { id: 'opacity', label: 'Opacidad' }]}
            onChange={(property) => onUpdate({ audioReactive: { ...asset.audioReactive!, property } })}
          />
          <Knob label="Cantidad" value={asset.audioReactive.amount} min={0} max={1} step={0.01}
            onChange={(v) => onUpdate({ audioReactive: { ...asset.audioReactive!, amount: v } })} />
        </>
      )}
    </div>
  )
}

// ——— Effects tab ———
function EffectsTab() {
  const { openProject, updateOpenProject } = useProjectStore()
  const pp: PostProcessingConfig = openProject?.postProcessing ?? DEFAULT_POST_PROCESSING

  const updateBloom = (patch: Partial<PostProcessingConfig['bloom']>) =>
    updateOpenProject({ postProcessing: { ...pp, bloom: { ...pp.bloom, ...patch } } })
  const updateGlitch = (patch: Partial<PostProcessingConfig['glitch']>) =>
    updateOpenProject({ postProcessing: { ...pp, glitch: { ...pp.glitch, ...patch } } })
  const updateCG = (patch: Partial<PostProcessingConfig['colorGrade']>) =>
    updateOpenProject({ postProcessing: { ...pp, colorGrade: { ...pp.colorGrade, ...patch } } })

  return (
    <div className="p-3 flex flex-col gap-5">
      {/* Bloom */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/70">Bloom</span>
          <button
            onClick={() => updateBloom({ enabled: !pp.bloom.enabled })}
            className={`relative w-8 h-4 rounded-full transition-colors ${pp.bloom.enabled ? 'bg-violet-600' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${pp.bloom.enabled ? 'translate-x-4' : ''}`} />
          </button>
        </div>
        <div className={`flex flex-col gap-3 transition-opacity ${pp.bloom.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
          <Knob label="Intensidad" value={pp.bloom.intensity} min={0} max={3} step={0.05} onChange={(v) => updateBloom({ intensity: v })} />
          <Knob label="Radio" value={pp.bloom.radius} min={0} max={1} step={0.01} onChange={(v) => updateBloom({ radius: v })} />
          <Knob label="Umbral" value={pp.bloom.threshold} min={0} max={1} step={0.01} onChange={(v) => updateBloom({ threshold: v })} />
        </div>
      </section>

      <div className="border-t border-white/6" />

      {/* Glitch */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/70">Glitch</span>
          <button
            onClick={() => updateGlitch({ enabled: !pp.glitch.enabled })}
            className={`relative w-8 h-4 rounded-full transition-colors ${pp.glitch.enabled ? 'bg-violet-600' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${pp.glitch.enabled ? 'translate-x-4' : ''}`} />
          </button>
        </div>
        <div className={`flex flex-col gap-3 transition-opacity ${pp.glitch.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
          <Toggle label="Solo en kick" checked={pp.glitch.onKick} onChange={(v) => updateGlitch({ onKick: v })} />
          <Knob label="Intensidad" value={pp.glitch.intensity} min={0} max={1} step={0.01} onChange={(v) => updateGlitch({ intensity: v })} />
          {!pp.glitch.onKick && (
            <Knob label="Frecuencia" value={pp.glitch.frequency} min={0} max={1} step={0.01} onChange={(v) => updateGlitch({ frequency: v })} />
          )}
        </div>
      </section>

      <div className="border-t border-white/6" />

      {/* Color Grade */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/70">Color Grade</span>
          <button
            onClick={() => updateCG({ enabled: !pp.colorGrade.enabled })}
            className={`relative w-8 h-4 rounded-full transition-colors ${pp.colorGrade.enabled ? 'bg-violet-600' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${pp.colorGrade.enabled ? 'translate-x-4' : ''}`} />
          </button>
        </div>
        <div className={`flex flex-col gap-3 transition-opacity ${pp.colorGrade.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
          <Knob label="Brillo" value={pp.colorGrade.brightness} min={0} max={2} step={0.01} onChange={(v) => updateCG({ brightness: v })} />
          <Knob label="Contraste" value={pp.colorGrade.contrast} min={0} max={3} step={0.01} onChange={(v) => updateCG({ contrast: v })} />
          <Knob label="Saturación" value={pp.colorGrade.saturation} min={0} max={3} step={0.01} onChange={(v) => updateCG({ saturation: v })} />
          <Knob label="Viñeta" value={pp.colorGrade.vignette} min={0} max={1} step={0.01} onChange={(v) => updateCG({ vignette: v })} />
        </div>
      </section>
    </div>
  )
}

export function PropertiesPanel() {
  const { openProject, updateOpenProject } = useProjectStore()
  const { rightPanelTab, setRightPanelTab, audioReactive, selectedShapeBlockId, setSelectedShapeBlockId, selectedMediaAssetId, setSelectedMediaAssetId } = useEditorStore()

  if (!openProject) return null

  const bg = openProject.background
  const ls = openProject.lyricStyle
  const pc = openProject.particles
  const hs = openProject.heroShape ?? DEFAULT_HERO_SHAPE
  const shapeTimeline = openProject.shapeTimeline ?? []
  const selectedBlock = shapeTimeline.find((b) => b.id === selectedShapeBlockId) ?? null
  const mediaAssets = openProject.mediaAssets ?? []
  const selectedMedia = mediaAssets.find((a) => a.id === selectedMediaAssetId) ?? null

  const updateSelectedBlock = (patch: Partial<ShapeBlock>) => {
    if (!selectedBlock) return
    updateOpenProject({ shapeTimeline: shapeTimeline.map((b) => (b.id === selectedBlock.id ? { ...b, ...patch } : b)) })
  }

  const deleteSelectedBlock = () => {
    if (!selectedBlock) return
    updateOpenProject({ shapeTimeline: shapeTimeline.filter((b) => b.id !== selectedBlock.id) })
    setSelectedShapeBlockId(null)
  }

  const updateMedia = (patch: Partial<MediaAsset>) => {
    if (!selectedMedia) return
    updateOpenProject({ mediaAssets: mediaAssets.map((a) => (a.id === selectedMedia.id ? { ...a, ...patch } : a)) })
  }

  const deleteMedia = () => {
    if (!selectedMedia) return
    updateOpenProject({ mediaAssets: mediaAssets.filter((a) => a.id !== selectedMedia.id) })
    setSelectedMediaAssetId(null)
  }

  return (
    <div className="flex flex-col h-full bg-surface-2 border-l border-white/8">
      {/* Tabs */}
      <div className="flex border-b border-white/8 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setRightPanelTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              rightPanelTab === t.id ? 'text-white border-b border-violet-500' : 'text-white/30 hover:text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {rightPanelTab === 'properties' && (
          <div className="p-3 flex flex-col gap-5">

            {/* Selected media asset editor — shown at top when an asset is selected */}
            {selectedMedia && (
              <section>
                <SectionHeader icon={Layers} label="Asset seleccionado" />
                <MediaAssetEditor asset={selectedMedia} onUpdate={updateMedia} onDelete={deleteMedia} />
              </section>
            )}

            {/* Background */}
            <section>
              <SectionHeader icon={Palette} label="Fondo" />
              <div className="flex flex-col gap-3">
                <SegmentedControl
                  value={bg.type}
                  options={[
                    { id: 'color', label: 'Color' },
                    { id: 'gradient', label: 'Gradiente' },
                    { id: 'image', label: 'Imagen' },
                    { id: 'video', label: 'Video' },
                  ]}
                  onChange={(type) => updateOpenProject({ background: { ...bg, type } })}
                />
                {(bg.type === 'color' || bg.type === 'gradient') && (
                  <ColorSwatch color={bg.color ?? '#0a0a0f'} onChange={(c) => updateOpenProject({ background: { ...bg, color: c } })} />
                )}
                {(bg.type === 'image' || bg.type === 'video') && (
                  <p className="text-xs text-white/25 text-center py-2">
                    Arrastra {bg.type === 'video' ? 'un vídeo' : 'una imagen'} al canvas
                  </p>
                )}
                <Knob label="Opacidad" value={bg.opacity} onChange={(v) => updateOpenProject({ background: { ...bg, opacity: v } })} />
                <Knob label="Blur" value={bg.blur} min={0} max={20} step={0.5} unit="px" onChange={(v) => updateOpenProject({ background: { ...bg, blur: v } })} />
              </div>
            </section>

            {/* Lyric Style */}
            <section>
              <SectionHeader icon={Type} label="Letras" />
              <div className="flex flex-col gap-3">
                <Knob label="Tamaño" value={ls.fontSize} min={16} max={120} step={1} unit="px" onChange={(v) => updateOpenProject({ lyricStyle: { ...ls, fontSize: v } })} />
                <ColorSwatch color={ls.color} onChange={(c) => updateOpenProject({ lyricStyle: { ...ls, color: c } })} />
                <div>
                  <p className="text-xs text-white/35 mb-2">Animación</p>
                  <SegmentedControl
                    value={ls.animation}
                    options={[{ id: 'bounce', label: 'Bounce' }, { id: 'fade', label: 'Fade' }, { id: 'karaoke', label: 'Karaoke' }, { id: 'slide', label: 'Slide' }]}
                    onChange={(a) => updateOpenProject({ lyricStyle: { ...ls, animation: a } })}
                  />
                </div>
                <Toggle label="Glow" checked={ls.glow} onChange={(v) => updateOpenProject({ lyricStyle: { ...ls, glow: v } })} />
                {ls.glow && <ColorSwatch color={ls.glowColor} onChange={(c) => updateOpenProject({ lyricStyle: { ...ls, glowColor: c } })} />}
              </div>
            </section>

            {/* Particles */}
            <section>
              <SectionHeader icon={Sparkles} label="Partículas" />
              <div className="flex flex-col gap-3">
                <Toggle label="Activar" checked={pc.enabled} onChange={(v) => updateOpenProject({ particles: { ...pc, enabled: v } })} />
                {pc.enabled && (
                  <>
                    <Knob label="Cantidad" value={pc.count} min={50} max={2000} step={50} onChange={(v) => updateOpenProject({ particles: { ...pc, count: v } })} />
                    <Knob label="Tamaño" value={pc.size} min={0.01} max={0.2} step={0.005} onChange={(v) => updateOpenProject({ particles: { ...pc, size: v } })} />
                    <ColorSwatch color={pc.color} onChange={(c) => updateOpenProject({ particles: { ...pc, color: c } })} />
                    <div>
                      <p className="text-xs text-white/35 mb-2">Reacciona a</p>
                      <SegmentedControl value={pc.reactTo}
                        options={[{ id: 'bass', label: 'Bass' }, { id: 'mid', label: 'Mid' }, { id: 'treble', label: 'Treble' }]}
                        onChange={(r) => updateOpenProject({ particles: { ...pc, reactTo: r } })}
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Hero Shape 3D */}
            <section>
              <SectionHeader icon={Orbit} label="Forma 3D" />
              <div className="flex flex-col gap-3">
                <Toggle label="Activar" checked={hs.enabled} onChange={(v) => updateOpenProject({ heroShape: { ...hs, enabled: v } })} />
                {hs.enabled && <ShapeFields value={hs} onChange={(patch) => updateOpenProject({ heroShape: { ...hs, ...patch } })} />}
                {shapeTimeline.length > 0 && (
                  <p className="text-[10px] text-white/25 leading-relaxed">
                    Esta figura se muestra salvo que el playhead esté sobre un bloque en el track de Formas.
                  </p>
                )}
              </div>
            </section>

            {/* Selected shape block */}
            {selectedBlock && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-white/30" />
                    <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                      Bloque {formatBlockTime(selectedBlock.start)}–{formatBlockTime(selectedBlock.end)}
                    </span>
                  </div>
                  <button onClick={deleteSelectedBlock} className="p-1 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <ShapeFields value={selectedBlock} onChange={updateSelectedBlock} />
                </div>
              </section>
            )}
          </div>
        )}

        {rightPanelTab === 'audio' && (
          <div className="p-3 flex flex-col gap-4">
            <SectionHeader icon={Zap} label="Audio Reactivo" />
            {(['bass', 'mid', 'treble'] as const).map((band) => {
              const colors = { bass: 'from-violet-600', mid: 'from-blue-500', treble: 'from-cyan-500' }
              return (
                <div key={band} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40 capitalize">{band}</span>
                    <span className="text-xs font-mono text-white/50">{(audioReactive[band] * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${colors[band]} to-violet-400 rounded-full`}
                      style={{ width: `${audioReactive[band] * 100}%`, transition: 'width 60ms linear' }} />
                  </div>
                </div>
              )
            })}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className={`py-2.5 rounded-xl text-center text-xs font-semibold transition-all duration-75 ${audioReactive.beat ? 'bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.5)]' : 'bg-white/4 text-white/20'}`}>
                Beat
              </div>
              <div className={`py-2.5 rounded-xl text-center text-xs font-semibold transition-all duration-75 ${audioReactive.kick ? 'bg-orange-600 text-white shadow-[0_0_16px_rgba(234,88,12,0.5)]' : 'bg-white/4 text-white/20'}`}>
                Kick
              </div>
            </div>
            <div className="mt-2 bg-black/20 rounded-xl p-3 border border-white/6">
              <p className="text-[10px] text-white/25 mb-2 uppercase tracking-wider">Espectro</p>
              <div className="flex items-end gap-px h-10">
                {Array.from({ length: 32 }, (_, i) => {
                  const band = i < 4 ? audioReactive.bass : i < 16 ? audioReactive.mid : audioReactive.treble
                  const h = Math.max(2, band * 40)
                  return <div key={i} className="flex-1 rounded-sm bg-violet-500/50" style={{ height: `${h}px` }} />
                })}
              </div>
            </div>
          </div>
        )}

        {rightPanelTab === 'effects' && <EffectsTab />}
      </div>
    </div>
  )
}
