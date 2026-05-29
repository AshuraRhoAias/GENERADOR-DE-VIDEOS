import { useState } from 'react'
import { Download, Lock, Zap } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useEditorStore } from '@/store/editorStore'
import { useAuthStore } from '@/store/authStore'

const resolutions = [
  { id: '720p', label: '720p', desc: 'HD · 1280×720', free: true },
  { id: '1080p', label: '1080p', desc: 'Full HD · 1920×1080', free: false },
  { id: '2K', label: '2K', desc: '2560×1440', free: false },
  { id: '4K', label: '4K', desc: 'Ultra HD · 3840×2160', free: false },
] as const

export function ExportModal() {
  const { showExportModal, setShowExportModal } = useEditorStore()
  const { user } = useAuthStore()
  const [resolution, setResolution] = useState<'720p' | '1080p' | '2K' | '4K'>('720p')
  const [fps, setFps] = useState<30 | 60>(30)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const isPro = user?.plan !== 'free'

  const handleExport = async () => {
    setExporting(true)
    setProgress(0)
    // Simulate export progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 120))
      setProgress(i)
    }
    setExporting(false)
    setShowExportModal(false)
  }

  return (
    <Modal open={showExportModal} onClose={() => !exporting && setShowExportModal(false)} title="Exportar video">
      <div className="flex flex-col gap-5">
        {/* Resolution */}
        <div>
          <p className="text-xs text-white/40 mb-2.5 font-medium uppercase tracking-wider">Resolución</p>
          <div className="grid grid-cols-2 gap-2">
            {resolutions.map((r) => {
              const locked = !r.free && !isPro
              return (
                <button
                  key={r.id}
                  onClick={() => !locked && setResolution(r.id)}
                  disabled={locked}
                  className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    resolution === r.id && !locked
                      ? 'border-violet-500 bg-violet-500/10'
                      : locked
                      ? 'border-white/5 bg-white/2 opacity-50 cursor-not-allowed'
                      : 'border-white/8 bg-white/3 hover:border-white/20'
                  }`}
                >
                  {locked && (
                    <Lock size={10} className="absolute top-2 right-2 text-white/30" />
                  )}
                  <span className="text-sm font-semibold text-white">{r.label}</span>
                  <span className="text-xs text-white/35">{r.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* FPS */}
        <div>
          <p className="text-xs text-white/40 mb-2.5 font-medium uppercase tracking-wider">FPS</p>
          <div className="flex gap-2">
            {([30, 60] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFps(f)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  fps === f
                    ? 'border-violet-500 bg-violet-500/10 text-white'
                    : 'border-white/8 bg-white/3 text-white/40 hover:text-white'
                }`}
              >
                {f} fps
              </button>
            ))}
          </div>
        </div>

        {/* Watermark warning for free */}
        {!isPro && (
          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-300">Plan Free · Con watermark</p>
              <p className="text-xs text-amber-400/60 mt-0.5">Upgrade para exportar sin marca de agua</p>
            </div>
          </div>
        )}

        {/* Progress */}
        {exporting && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/40">Exportando...</span>
              <span className="text-xs font-mono text-white/60">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={() => setShowExportModal(false)} disabled={exporting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleExport} loading={exporting}>
            {!exporting && <Download size={14} />}
            {exporting ? `Exportando ${progress}%` : `Exportar ${resolution}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
