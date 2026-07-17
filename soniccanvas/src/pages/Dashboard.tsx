import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Plus, LogOut, MoreHorizontal, Copy, Trash2,
  Clock, Film, Sparkles, ChevronRight, Music2,
  Wand2, Grid3X3, List, Search, Crown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import type { ProjectMeta } from '@/types/project'

const GRADIENT_THUMBS = [
  'from-violet-800 via-purple-700 to-indigo-800',
  'from-rose-800 via-pink-700 to-fuchsia-800',
  'from-cyan-800 via-blue-700 to-indigo-800',
  'from-amber-800 via-orange-700 to-red-800',
  'from-emerald-800 via-teal-700 to-cyan-800',
]

function formatDate(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'Justo ahora'
  if (diff < 3600000) return 'Hace ' + Math.floor(diff / 60000) + 'm'
  if (diff < 86400000) return 'Hace ' + Math.floor(diff / 3600000) + 'h'
  return new Date(ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function formatDuration(sec: number) {
  if (!sec) return '--:--'
  return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0')
}

function WaveformDecor({ index }: { index: number }) {
  const bars = Array.from({ length: 16 }, (_, i) =>
    Math.round(6 + Math.abs(Math.sin(i * 0.8 + index) * 4 + Math.sin(i * 1.5 + index * 2) * 3))
  )
  return (
    <div className="absolute bottom-3 right-3 flex items-end gap-0.5 opacity-20">
      {bars.map((h, i) => (
        <div key={i} className="w-1 rounded-sm bg-white" style={{ height: h + 'px' }} />
      ))}
    </div>
  )
}

function ProjectCard({ project, index, onOpen, onDelete, onDuplicate }: {
  project: ProjectMeta; index: number
  onOpen: () => void; onDelete: () => void; onDuplicate: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const gradClass = GRADIENT_THUMBS[index % GRADIENT_THUMBS.length]

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.04 }}
      className="hover-lift group relative bg-surface-2 border border-white/8 rounded-2xl overflow-hidden hover:border-violet-500/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] transition-all duration-300 cursor-pointer"
      onClick={onOpen}
    >
      <div className={'aspect-video bg-gradient-to-br ' + gradClass + ' relative overflow-hidden'}>
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            <WaveformDecor index={index} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Film size={18} className="text-white/60" />
              </div>
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/60 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
          {formatDuration(project.durationSec)}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-white font-semibold border border-white/20">
            Abrir <ChevronRight size={14} />
          </div>
        </div>
      </div>
      <div className="p-3.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white/80 truncate group-hover:text-white transition-colors">{project.title}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock size={10} className="text-white/20 shrink-0" />
            <span className="text-[11px] text-white/25">{formatDate(project.updatedAt)}</span>
          </div>
        </div>
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-white/8 text-white/20 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100">
            <MoreHorizontal size={15} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div className="absolute right-0 top-8 z-20 bg-surface-4 border border-white/10 rounded-xl shadow-2xl py-1 w-40"
                  initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.1 }}>
                  <button onClick={() => { onDuplicate(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                    <Copy size={12} /> Duplicar
                  </button>
                  <div className="my-1 border-t border-white/6" />
                  <button onClick={() => { onDelete(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-colors">
                    <Trash2 size={12} /> Eliminar
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { projects, createProject, deleteProject, duplicateProject, openProjectById } = useProjectStore()
  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')

  const filtered = projects.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))

  const handleCreate = () => {
    const title = newTitle.trim() || 'Sin título'
    const proj = createProject(title)
    openProjectById(proj.id)
    navigate('/editor/' + proj.id)
    setShowNewModal(false)
    setNewTitle('')
  }

  const handleOpen = (id: string) => { openProjectById(id); navigate('/editor/' + id) }

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <header className="h-14 border-b border-white/6 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20 bg-surface-0/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.5)]">
            <Music2 size={14} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">SonicCanvas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-3 border-r border-white/8">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-medium text-white/80">{user?.name}</p>
              <p className="text-[10px] text-white/30">Plan Free</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/60 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Hero */}
        <div className="animate-fade-in-up mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900/40 via-indigo-900/20 to-surface-2 border border-violet-500/15 p-6 md:p-8">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          <div className="animate-float-slow absolute top-0 right-0 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs text-violet-400/80 font-medium mb-2">Bienvenido de vuelta, {user?.name?.split(' ')[0]} 👋</p>
              <h1 className="text-2xl md:text-3xl font-black text-white">Mis proyectos</h1>
              <p className="text-sm text-white/30 mt-1">{projects.length} proyecto{projects.length !== 1 ? 's' : ''} · Plan Free</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')}
                className="hidden md:flex items-center gap-2 text-xs text-white/40 hover:text-white/70 px-3 py-2 rounded-xl border border-white/8 hover:border-white/15 transition-all">
                <Wand2 size={13} /> Landing
              </button>
              <Button variant="primary" className="btn-shine" onClick={() => setShowNewModal(true)} disabled={projects.length >= 1}>
                <Plus size={15} /> Nuevo
              </Button>
            </div>
          </div>
          <div className="relative flex gap-8 mt-6 pt-5 border-t border-white/6 flex-wrap">
            {[
              { label: 'Proyectos usados', value: projects.length + ' / 1' },
              { label: 'Plan actual', value: 'Free' },
              { label: 'Exportaciones', value: '0' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-lg font-bold text-white">{value}</div>
                <div className="text-[11px] text-white/30 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade */}
        <div className="animate-fade-in-up delay-100 mb-6 flex items-center justify-between gap-4 bg-gradient-to-r from-amber-500/8 to-orange-500/6 border border-amber-500/15 rounded-2xl px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Crown size={15} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white/80">Proyectos ilimitados · 4K sin watermark · Templates premium</p>
              <p className="text-xs text-white/30 mt-0.5">Desde $4.99 / mes</p>
            </div>
          </div>
          <button className="shrink-0 text-xs text-amber-400 border border-amber-500/25 hover:bg-amber-500/10 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Ver planes →
          </button>
        </div>

        {/* Controls */}
        <div className="animate-fade-in-up delay-200 flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/4 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors" />
          </div>
          <div className="ml-auto flex items-center gap-0.5 bg-white/4 rounded-lg p-0.5 border border-white/6">
            {(['grid', 'list'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={'p-1.5 rounded-md transition-colors ' + (viewMode === mode ? 'bg-white/12 text-white' : 'text-white/25 hover:text-white/50')}>
                {mode === 'grid' ? <Grid3X3 size={13} /> : <List size={13} />}
              </button>
            ))}
          </div>
        </div>

        {projects.length === 0 && (
          <motion.div className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-900/40 to-indigo-900/30 border border-violet-500/15 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(124,58,237,0.12)]">
              <Sparkles size={32} className="text-violet-400/50" />
            </div>
            <h3 className="text-lg font-bold text-white/50 mb-2">Sin proyectos todavía</h3>
            <p className="text-sm text-white/25 mb-6 max-w-xs">Crea tu primer video musical con partículas 3D, letras reactivas y exportación HD</p>
            <Button variant="primary" className="btn-shine" onClick={() => setShowNewModal(true)}><Plus size={15} /> Crear primer proyecto</Button>
          </motion.div>
        )}

        {projects.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Search size={24} className="text-white/10 mb-3" />
            <p className="text-sm text-white/30">Sin resultados para "{search}"</p>
          </div>
        )}

        {filtered.length > 0 && (
          <motion.div className={viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
            : 'flex flex-col gap-2'} layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) =>
                viewMode === 'grid' ? (
                  <ProjectCard key={p.id} project={p} index={i}
                    onOpen={() => handleOpen(p.id)}
                    onDelete={() => setDeleteTarget(p.id)}
                    onDuplicate={() => duplicateProject(p.id)} />
                ) : (
                  <motion.div key={p.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="hover-lift group flex items-center gap-4 bg-surface-2 border border-white/6 rounded-xl px-4 py-3 hover:border-violet-500/30 transition-all cursor-pointer"
                    onClick={() => handleOpen(p.id)}>
                    <div className={'w-12 h-8 rounded-lg bg-gradient-to-br shrink-0 ' + GRADIENT_THUMBS[i % GRADIENT_THUMBS.length]} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate group-hover:text-white">{p.title}</p>
                      <p className="text-[11px] text-white/25">{formatDate(p.updatedAt)} · {formatDuration(p.durationSec)}</p>
                    </div>
                    <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Nuevo proyecto">
        <div className="flex flex-col gap-4">
          <Input label="Nombre" placeholder="Mi video musical" value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowNewModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCreate}><Plus size={14} /> Crear</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar proyecto">
        <p className="text-sm text-white/50 mb-5">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => { deleteProject(deleteTarget!); setDeleteTarget(null) }}>
            <Trash2 size={14} /> Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
