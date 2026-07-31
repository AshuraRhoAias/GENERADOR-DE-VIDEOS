import { X, Lock, Sparkles, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { TEMPLATES } from '@/lib/templates'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'

const TEMPLATE_GRADIENTS: Record<string, string> = {
  'neon-lyrics':      'from-violet-900 via-purple-800 to-indigo-900',
  'space-visualizer': 'from-blue-950 via-indigo-900 to-violet-950',
  'phonk-glitch':     'from-gray-900 via-red-950 to-gray-900',
  'karaoke-clean':    'from-slate-800 via-slate-700 to-slate-800',
  'dark-cinematic':   'from-stone-900 via-amber-950 to-stone-900',
  'lofi-rain':        'from-cyan-950 via-blue-900 to-slate-900',
  'cyberpunk-city':   'from-fuchsia-950 via-violet-900 to-cyan-950',
}

const TEMPLATE_ACCENT: Record<string, string> = {
  'neon-lyrics':      'text-violet-300',
  'space-visualizer': 'text-blue-300',
  'phonk-glitch':     'text-red-300',
  'karaoke-clean':    'text-slate-300',
  'dark-cinematic':   'text-amber-300',
  'lofi-rain':        'text-cyan-300',
  'cyberpunk-city':   'text-fuchsia-300',
}

export function TemplateGallery() {
  const { showTemplateGallery, setShowTemplateGallery } = useEditorStore()
  const { openProject, updateOpenProject } = useProjectStore()
  const { user } = useAuthStore()

  const isPro = user?.plan !== 'free'
  const categories = [...new Set(TEMPLATES.map((t) => t.category))]

  const applyTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId)
    if (!tpl || !openProject) return
    updateOpenProject({ ...tpl.config, template: tpl.id })
    setShowTemplateGallery(false)
  }

  return (
    <Modal open={showTemplateGallery} onClose={() => setShowTemplateGallery(false)} title="" width="max-w-3xl">
      <div className="-m-5">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/8 bg-[#111118]">
          <div>
            <h3 className="text-base font-bold text-white">Templates</h3>
            <p className="text-xs text-white/30 mt-0.5">{TEMPLATES.length} estilos · {TEMPLATES.filter(t => !t.isPremium).length} gratis</p>
          </div>
          <button onClick={() => setShowTemplateGallery(false)}
            className="p-1.5 rounded-lg hover:bg-white/8 text-white/35 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">{cat}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TEMPLATES.filter((t) => t.category === cat).map((tpl) => {
                  const locked = tpl.isPremium && !isPro
                  const isActive = openProject?.template === tpl.id
                  const grad = TEMPLATE_GRADIENTS[tpl.id] ?? 'from-violet-900 to-indigo-900'
                  const accent = TEMPLATE_ACCENT[tpl.id] ?? 'text-violet-300'

                  return (
                    <button
                      key={tpl.id}
                      onClick={() => !locked && applyTemplate(tpl.id)}
                      disabled={locked}
                      className={`relative flex flex-col rounded-2xl overflow-hidden text-left transition-all group ${
                        isActive
                          ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#111118]'
                          : locked
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
                      }`}
                    >
                      {/* Preview thumbnail */}
                      <div className={'aspect-video w-full bg-gradient-to-br ' + grad + ' relative overflow-hidden'}>
                        {/* Fake waveform bars */}
                        <div className="absolute bottom-2 inset-x-2 flex items-end gap-0.5 h-8">
                          {Array.from({ length: 20 }, (_, i) => {
                            const h = 20 + Math.abs(Math.sin(i * 0.9 + tpl.id.length * 0.3) * 60)
                            return (
                              <div key={i} className="flex-1 rounded-sm bg-white/20" style={{ height: h + '%' }} />
                            )
                          })}
                        </div>
                        {/* Fake lyric text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={'text-[10px] font-black uppercase tracking-wider ' + accent + ' opacity-80'}>
                            {tpl.emoji} {tpl.name}
                          </div>
                        </div>
                        {/* Badges */}
                        {locked && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
                            <Lock size={9} className="text-white/60" />
                            <span className="text-[9px] text-white/60">Pro</span>
                          </div>
                        )}
                        {tpl.isPremium && !locked && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full px-2 py-0.5">
                            <Sparkles size={9} className="text-amber-400" />
                            <span className="text-[9px] text-amber-300">Premium</span>
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute top-2 left-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3 bg-white/4 border border-white/8 border-t-0 rounded-b-2xl">
                        <p className="text-xs font-semibold text-white/90 truncate">{tpl.name}</p>
                        <p className="text-[10px] text-white/35 mt-0.5 leading-snug line-clamp-1">{tpl.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
