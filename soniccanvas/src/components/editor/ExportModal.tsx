import { useState } from 'react'
import { Download, Lock, Zap, Film, Music, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'

const resolutions = [
  { id: '720p',  label: '720p',  sub: '1280 × 720',   free: true },
  { id: '1080p', label: '1080p', sub: '1920 × 1080',  free: false },
  { id: '2K',    label: '2K',    sub: '2560 × 1440',  free: false },
  { id: '4K',    label: '4K',    sub: '3840 × 2160',  free: false },
] as const

const formats = [
  { id: 'mp4',  label: 'MP4',  desc: 'H.264 · Compatible universal', icon: Film },
  { id: 'webm', label: 'WebM', desc: 'VP9 · Web optimizado',         icon: Film },
  { id: 'gif',  label: 'GIF',  desc: 'Loop animado · Sin audio',     icon: Music },
] as const

type Resolution = typeof resolutions[number]['id']
type Format = typeof formats[number]['id']

const EXPORT_STAGES = [
  'Analizando proyecto...',
  'Renderizando frames...',
  'Codificando video...',
  'Aplicando efectos...',
  'Finalizando...',
]

export function ExportModal() {
  const { showExportModal, setShowExportModal, duration } = useEditorStore()
  const { openProject } = useProjectStore()
  const { user } = useAuthStore()
  const [resolution, setResolution] = useState<Resolution>('720p')
  const [format, setFormat] = useState<Format>('mp4')
  const [fps, setFps] = useState<30 | 60>(30)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(0)
  const [done, setDone] = useState(false)

  const isPro = user?.plan !== 'free'
  const selectedRes = resolutions.find((r) => r.id === resolution)!

  const handleExport = async () => {
    setExporting(true)
    setProgress(0)
    setDone(false)

    for (let i = 0; i <= 100; i++) {
      await new Promise((r) => setTimeout(r, 60))
      setProgress(i)
      setStage(Math.floor((i / 100) * (EXPORT_STAGES.length - 1)))
    }

    setExporting(false)
    setDone(true)
  }

  const handleClose = () => {
    if (exporting) return
    setShowExportModal(false)
    setDone(false)
    setProgress(0)
  }

  return (
    <Modal open={showExportModal} onClose={handleClose} title="">
      <div className="flex flex-col gap-0 -m-6">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-violet-900/60 to-indigo-900/40 border-b border-white/8 p-5 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <Download size={17} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Exportar video</h2>
              <p className="text-xs text-white/40">{openProject?.title ?? 'Sin título'}</p>
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {done ? (
            /* Done state */
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center">
                <Check size={28} className="text-green-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">¡Exportación completa!</p>
                <p className="text-xs text-white/40 mt-1">
                  {resolution} · {fps}fps · {format.toUpperCase()}
                </p>
              </div>
              <Button variant="primary" onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          ) : exporting ? (
            /* Export progress */
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">{EXPORT_STAGES[stage]}</span>
                <span className="font-mono text-white/70">{progress}%</span>
              </div>
              <div className="relative h-2 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 via-violet-400 to-blue-400 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
                {/* Shimmer */}
                <div
                  className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
                  style={{ left: `${Math.max(0, progress - 10)}%` }}
                />
              </div>
              <div className="grid grid-cols-5 gap-1 mt-1">
                {EXPORT_STAGES.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-full h-0.5 rounded-full transition-colors ${
                      i <= stage ? 'bg-violet-500' : 'bg-white/10'
                    }`} />
                    <span className="text-[9px] text-white/20 text-center leading-tight hidden sm:block">{s.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Resolution */}
              <div>
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">Resolución</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {resolutions.map((r) => {
                    const locked = !r.free && !isPro
                    const active = resolution === r.id && !locked
                    return (
                      <button
                        key={r.id}
                        onClick={() => !locked && setResolution(r.id)}
                        disabled={locked}
                        className={`relative flex flex-col items-center py-3 rounded-xl border text-center transition-all ${
                          active
                            ? 'border-violet-500 bg-violet-500/12 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.3)]'
                            : locked
                            ? 'border-white/5 bg-white/2 opacity-40 cursor-not-allowed'
                            : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        {locked && (
                          <Lock size={9} className="absolute top-1.5 right-1.5 text-white/30" />
                        )}
                        <span className={`text-sm font-bold ${active ? 'text-violet-300' : 'text-white/70'}`}>{r.label}</span>
                        <span className="text-[9px] text-white/25 mt-0.5">{r.sub.split(' × ')[1]}p</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Format */}
              <div>
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">Formato</p>
                <div className="flex flex-col gap-1.5">
                  {formats.map(({ id, label, desc }) => (
                    <button
                      key={id}
                      onClick={() => setFormat(id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                        format === id
                          ? 'border-violet-500/50 bg-violet-500/8'
                          : 'border-white/6 bg-white/3 hover:border-white/15'
                      }`}
                    >
                      <div className={`w-1 self-stretch rounded-full ${format === id ? 'bg-violet-500' : 'bg-white/10'}`} />
                      <div>
                        <div className="text-xs font-semibold text-white/80">{label}</div>
                        <div className="text-[10px] text-white/30">{desc}</div>
                      </div>
                      {format === id && <Check size={13} className="ml-auto text-violet-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* FPS */}
              <div>
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">Velocidad</p>
                <div className="flex gap-2">
                  {([30, 60] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFps(f)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        fps === f
                          ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                          : 'border-white/6 bg-white/3 text-white/35 hover:text-white/60'
                      }`}
                    >
                      {f} <span className="text-xs font-normal opacity-60">fps</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary row */}
              <div className="flex items-center gap-2 bg-white/4 rounded-xl px-3 py-2.5 border border-white/6">
                <Film size={13} className="text-white/30 shrink-0" />
                <div className="text-xs text-white/50 flex-1">
                  <span className="text-white/70 font-medium">{selectedRes.sub}</span>
                  {' · '}{fps}fps{' · '}{format.toUpperCase()}
                  {duration > 0 && <> · {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</>}
                </div>
                {!isPro && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">Watermark</span>
                )}
              </div>

              {/* Free warning */}
              {!isPro && (
                <div className="flex items-center gap-2.5 bg-amber-500/8 border border-amber-500/15 rounded-xl p-3">
                  <Zap size={13} className="text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300/80">
                    Plan Free exporta con watermark en 720p. <span className="text-amber-300 underline cursor-pointer">Upgrade →</span>
                  </p>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          {!done && !exporting && (
            <div className="flex gap-2 justify-end pt-1 border-t border-white/6">
              <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
              <Button variant="primary" onClick={handleExport}>
                <Download size={13} />
                Exportar {resolution}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
