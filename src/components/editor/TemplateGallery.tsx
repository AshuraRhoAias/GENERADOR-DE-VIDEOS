import { X, Lock, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { TEMPLATES } from '@/lib/templates'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'

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
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/8 bg-surface-3">
          <div>
            <h3 className="text-base font-semibold text-white">Templates</h3>
            <p className="text-xs text-white/35 mt-0.5">Elige un estilo para tu video</p>
          </div>
          <button
            onClick={() => setShowTemplateGallery(false)}
            className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Templates grid */}
        <div className="p-5">
          {categories.map((cat) => (
            <div key={cat} className="mb-6">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">{cat}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TEMPLATES.filter((t) => t.category === cat).map((tpl) => {
                  const locked = tpl.isPremium && !isPro
                  const isActive = openProject?.template === tpl.id

                  return (
                    <button
                      key={tpl.id}
                      onClick={() => !locked && applyTemplate(tpl.id)}
                      disabled={locked}
                      className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'border-violet-500 bg-violet-500/10'
                          : locked
                          ? 'border-white/5 bg-white/2 opacity-50 cursor-not-allowed'
                          : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      {locked && (
                        <Lock size={11} className="absolute top-2.5 right-2.5 text-white/30" />
                      )}
                      {tpl.isPremium && !locked && (
                        <Sparkles size={11} className="absolute top-2.5 right-2.5 text-amber-400" />
                      )}
                      <span className="text-2xl mb-2">{tpl.emoji}</span>
                      <span className="text-sm font-semibold text-white">{tpl.name}</span>
                      <span className="text-xs text-white/35 mt-0.5 leading-snug">{tpl.description}</span>
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
