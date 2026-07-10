import { useProjectStore, DEFAULT_HERO_SHAPE } from '@/store/projectStore'
import { useEditorStore } from '@/store/editorStore'
import { Palette, Zap, Sparkles, Type, Orbit, type LucideIcon } from 'lucide-react'

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
      <div
        className="w-6 h-6 rounded-md border border-white/20 group-hover:border-white/40 transition-colors shrink-0"
        style={{ background: color }}
      />
      <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="sr-only" />
      <span className="text-xs text-white/40 font-mono group-hover:text-white/60 transition-colors">
        {color.toUpperCase()}
      </span>
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
        <span className="text-xs text-white/50 font-mono">{Number.isInteger(step) || step >= 1 ? Math.round(value) : value.toFixed(2)}{unit}</span>
      </div>
      <div className="relative h-1 bg-white/8 rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-violet-500 rounded-full pointer-events-none"
          style={{ width: `${pct}%` }}
        />
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
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-4 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2 disabled:cursor-not-allowed ${checked ? 'bg-violet-600' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  )
}

function SegmentedControl<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 bg-white/4 rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${
            value === o.id ? 'bg-violet-600 text-white shadow' : 'text-white/35 hover:text-white/60'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function PropertiesPanel() {
  const { openProject, updateOpenProject } = useProjectStore()
  const { rightPanelTab, setRightPanelTab, audioReactive } = useEditorStore()

  if (!openProject) return null

  const bg = openProject.background
  const ls = openProject.lyricStyle
  const pc = openProject.particles
  const hs = openProject.heroShape ?? DEFAULT_HERO_SHAPE

  return (
    <div className="flex flex-col h-full bg-surface-2 border-l border-white/8">
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

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {rightPanelTab === 'properties' && (
          <div className="p-3 flex flex-col gap-5">
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
                  ]}
                  onChange={(type) => updateOpenProject({ background: { ...bg, type } })}
                />

                {bg.type === 'color' && (
                  <ColorSwatch
                    color={bg.color ?? '#0a0a0f'}
                    onChange={(c) => updateOpenProject({ background: { ...bg, color: c } })}
                  />
                )}

                {bg.type === 'gradient' && (
                  <div className="flex flex-col gap-2">
                    <div className="h-6 rounded-lg border border-white/10" style={{
                      background: `linear-gradient(135deg, ${bg.color ?? '#0a0a0f'}, #7c3aed)`
                    }} />
                    <ColorSwatch
                      color={bg.color ?? '#0a0a0f'}
                      onChange={(c) => updateOpenProject({ background: { ...bg, color: c } })}
                    />
                  </div>
                )}

                {bg.type === 'image' && (
                  <p className="text-xs text-white/25 text-center py-2">
                    Arrastra una imagen al canvas
                  </p>
                )}

                <Knob
                  label="Opacidad"
                  value={bg.opacity}
                  onChange={(v) => updateOpenProject({ background: { ...bg, opacity: v } })}
                />
                <Knob
                  label="Blur"
                  value={bg.blur}
                  min={0} max={20} step={0.5} unit="px"
                  onChange={(v) => updateOpenProject({ background: { ...bg, blur: v } })}
                />
              </div>
            </section>

            {/* Lyric Style */}
            <section>
              <SectionHeader icon={Type} label="Letras" />
              <div className="flex flex-col gap-3">
                <Knob
                  label="Tamaño"
                  value={ls.fontSize}
                  min={16} max={120} step={1} unit="px"
                  onChange={(v) => updateOpenProject({ lyricStyle: { ...ls, fontSize: v } })}
                />
                <ColorSwatch
                  color={ls.color}
                  onChange={(c) => updateOpenProject({ lyricStyle: { ...ls, color: c } })}
                />
                <div>
                  <p className="text-xs text-white/35 mb-2">Animación</p>
                  <SegmentedControl
                    value={ls.animation}
                    options={[
                      { id: 'bounce', label: 'Bounce' },
                      { id: 'fade', label: 'Fade' },
                      { id: 'karaoke', label: 'Karaoke' },
                      { id: 'slide', label: 'Slide' },
                    ]}
                    onChange={(a) => updateOpenProject({ lyricStyle: { ...ls, animation: a } })}
                  />
                </div>
                <Toggle
                  label="Glow"
                  checked={ls.glow}
                  onChange={(v) => updateOpenProject({ lyricStyle: { ...ls, glow: v } })}
                />
                {ls.glow && (
                  <ColorSwatch
                    color={ls.glowColor}
                    onChange={(c) => updateOpenProject({ lyricStyle: { ...ls, glowColor: c } })}
                  />
                )}
              </div>
            </section>

            {/* Particles */}
            <section>
              <SectionHeader icon={Sparkles} label="Partículas" />
              <div className="flex flex-col gap-3">
                <Toggle
                  label="Activar"
                  checked={pc.enabled}
                  onChange={(v) => updateOpenProject({ particles: { ...pc, enabled: v } })}
                />
                {pc.enabled && (
                  <>
                    <Knob
                      label="Cantidad"
                      value={pc.count}
                      min={50} max={2000} step={50}
                      onChange={(v) => updateOpenProject({ particles: { ...pc, count: v } })}
                    />
                    <Knob
                      label="Tamaño"
                      value={pc.size}
                      min={0.01} max={0.2} step={0.005}
                      onChange={(v) => updateOpenProject({ particles: { ...pc, size: v } })}
                    />
                    <ColorSwatch
                      color={pc.color}
                      onChange={(c) => updateOpenProject({ particles: { ...pc, color: c } })}
                    />
                    <div>
                      <p className="text-xs text-white/35 mb-2">Reacciona a</p>
                      <SegmentedControl
                        value={pc.reactTo}
                        options={[
                          { id: 'bass', label: 'Bass' },
                          { id: 'mid', label: 'Mid' },
                          { id: 'treble', label: 'Treble' },
                        ]}
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
                <Toggle
                  label="Activar"
                  checked={hs.enabled}
                  onChange={(v) => updateOpenProject({ heroShape: { ...hs, enabled: v } })}
                />
                {hs.enabled && (
                  <>
                    <div>
                      <p className="text-xs text-white/35 mb-2">Figura</p>
                      <SegmentedControl
                        value={hs.type}
                        options={[
                          { id: 'torusKnot', label: 'Nudo' },
                          { id: 'sphereKnot', label: 'Orbe' },
                        ]}
                        onChange={(type) => updateOpenProject({ heroShape: { ...hs, type } })}
                      />
                    </div>
                    <ColorSwatch
                      color={hs.colorA}
                      onChange={(c) => updateOpenProject({ heroShape: { ...hs, colorA: c } })}
                    />
                    <ColorSwatch
                      color={hs.colorB}
                      onChange={(c) => updateOpenProject({ heroShape: { ...hs, colorB: c } })}
                    />
                    <ColorSwatch
                      color={hs.wireframeColor}
                      onChange={(c) => updateOpenProject({ heroShape: { ...hs, wireframeColor: c } })}
                    />
                    <Knob
                      label="Complejidad (p)"
                      value={hs.knotP}
                      min={2} max={5} step={1}
                      onChange={(v) => updateOpenProject({ heroShape: { ...hs, knotP: v } })}
                    />
                    <Knob
                      label="Complejidad (q)"
                      value={hs.knotQ}
                      min={2} max={9} step={1}
                      onChange={(v) => updateOpenProject({ heroShape: { ...hs, knotQ: v } })}
                    />
                    <div>
                      <p className="text-xs text-white/35 mb-2">Reacciona a</p>
                      <SegmentedControl
                        value={hs.reactTo}
                        options={[
                          { id: 'bass', label: 'Bass' },
                          { id: 'mid', label: 'Mid' },
                          { id: 'treble', label: 'Treble' },
                        ]}
                        onChange={(r) => updateOpenProject({ heroShape: { ...hs, reactTo: r } })}
                      />
                    </div>
                  </>
                )}
              </div>
            </section>
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
                    <span className="text-xs font-mono text-white/50">
                      {(audioReactive[band] * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors[band]} to-violet-400 rounded-full`}
                      style={{
                        width: `${audioReactive[band] * 100}%`,
                        transition: 'width 60ms linear',
                      }}
                    />
                  </div>
                </div>
              )
            })}

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className={`py-2.5 rounded-xl text-center text-xs font-semibold transition-all duration-75 ${
                audioReactive.beat
                  ? 'bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.5)]'
                  : 'bg-white/4 text-white/20'
              }`}>
                Beat
              </div>
              <div className={`py-2.5 rounded-xl text-center text-xs font-semibold transition-all duration-75 ${
                audioReactive.kick
                  ? 'bg-orange-600 text-white shadow-[0_0_16px_rgba(234,88,12,0.5)]'
                  : 'bg-white/4 text-white/20'
              }`}>
                Kick
              </div>
            </div>

            {/* Frequency spectrum preview */}
            <div className="mt-2 bg-black/20 rounded-xl p-3 border border-white/6">
              <p className="text-[10px] text-white/25 mb-2 uppercase tracking-wider">Espectro</p>
              <div className="flex items-end gap-px h-10">
                {Array.from({ length: 32 }, (_, i) => {
                  const band = i < 4 ? audioReactive.bass : i < 16 ? audioReactive.mid : audioReactive.treble
                  const noise = Math.sin(i * 2.3 + Date.now() * 0.001) * 0.1
                  const h = Math.max(2, (band + noise) * 40)
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-violet-500/50"
                      style={{ height: `${h}px` }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {rightPanelTab === 'effects' && (
          <div className="p-3 flex flex-col gap-5">
            <SectionHeader icon={Zap} label="Post-proceso" />

            {/* Bloom */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/60">Bloom</span>
                <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">Sprint 4</span>
              </div>
              <div className="flex flex-col gap-3 opacity-40 pointer-events-none" aria-disabled="true">
                <Knob label="Intensidad" value={0.8} min={0} max={3} onChange={() => {}} />
                <Knob label="Radio" value={0.4} min={0} max={1} onChange={() => {}} />
              </div>
            </section>

            {/* Glitch */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/60">Glitch</span>
                <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">Sprint 4</span>
              </div>
              <div className="flex flex-col gap-3 opacity-40 pointer-events-none" aria-disabled="true">
                <Knob label="Frecuencia" value={0.1} min={0} max={1} onChange={() => {}} />
                <Knob label="Intensidad" value={0.3} min={0} max={1} onChange={() => {}} />
                <Toggle label="Solo en kick" checked={true} onChange={() => {}} disabled />
              </div>
            </section>

            {/* Color grade */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/60">Color Grade</span>
                <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">Sprint 4</span>
              </div>
              <div className="flex flex-col gap-3 opacity-40 pointer-events-none" aria-disabled="true">
                <Knob label="Saturación" value={1.2} min={0} max={3} onChange={() => {}} />
                <Knob label="Contraste" value={1.1} min={0} max={3} onChange={() => {}} />
                <Knob label="Vignette" value={0.3} min={0} max={1} onChange={() => {}} />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
