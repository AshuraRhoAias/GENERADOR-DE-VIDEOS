import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Music2, LogOut, MoreHorizontal, Copy, Trash2,
  Clock, Film, Sparkles, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import type { ProjectMeta } from '@/types/project'

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDuration(sec: number) {
  if (!sec) return '--:--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function ProjectCard({ project, onOpen, onDelete, onDuplicate }: {
  project: ProjectMeta
  onOpen: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-[#111118] border border-white/8 rounded-xl overflow-hidden hover:border-violet-500/40 transition-all duration-200 cursor-pointer"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-violet-900/30 to-indigo-900/20 flex items-center justify-center relative">
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <Film size={32} className="text-white/15" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 right-2 text-xs text-white/50 font-mono">
          {formatDuration(project.durationSec)}
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-sm text-white font-medium">
            Abrir <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{project.title}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock size={11} className="text-white/25" />
            <span className="text-xs text-white/30">{formatDate(project.updatedAt)}</span>
          </div>
        </div>

        {/* Menu button */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={15} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  className="absolute right-0 top-8 z-20 bg-[#1e1e2a] border border-white/10 rounded-xl shadow-2xl py-1.5 w-40 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.1 }}
                >
                  <button
                    onClick={() => { onDuplicate(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Copy size={13} /> Duplicar
                  </button>
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-colors"
                  >
                    <Trash2 size={13} /> Eliminar
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

  const handleCreate = () => {
    const title = newTitle.trim() || 'Sin título'
    const proj = createProject(title)
    openProjectById(proj.id)
    navigate(`/editor/${proj.id}`)
    setShowNewModal(false)
    setNewTitle('')
  }

  const handleOpen = (id: string) => {
    openProjectById(id)
    navigate(`/editor/${id}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Topbar */}
      <header className="h-14 border-b border-white/8 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <Music2 size={14} className="text-white" />
          </div>
          <span className="font-semibold text-white text-sm">SonicCanvas</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-500/20 rounded-full flex items-center justify-center text-xs font-medium text-violet-300">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-white/70">{user?.name}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wide">Plan Free</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Mis proyectos</h1>
            <p className="text-sm text-white/35 mt-0.5">
              {projects.length} proyecto{projects.length !== 1 ? 's' : ''} · Plan Free (1 máx.)
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowNewModal(true)}
            disabled={projects.length >= 1}
            title={projects.length >= 1 ? 'Upgrade para más proyectos' : ''}
          >
            <Plus size={16} /> Nuevo proyecto
          </Button>
        </div>

        {/* Upgrade banner for Free */}
        <div className="mb-6 bg-gradient-to-r from-violet-900/20 to-indigo-900/20 border border-violet-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-violet-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Estás en el Plan Free</p>
              <p className="text-xs text-white/40 mt-0.5">Upgrade para exportar en 1080p, más proyectos y sin watermark</p>
            </div>
          </div>
          <Button variant="primary" size="sm">
            Ver planes
          </Button>
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 bg-white/4 rounded-2xl flex items-center justify-center mb-4">
              <Film size={36} className="text-white/15" />
            </div>
            <h3 className="text-lg font-semibold text-white/60 mb-1">Sin proyectos aún</h3>
            <p className="text-sm text-white/30 mb-6">Crea tu primer video musical</p>
            <Button variant="primary" onClick={() => setShowNewModal(true)}>
              <Plus size={16} /> Crear proyecto
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            layout
          >
            <AnimatePresence mode="popLayout">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={() => handleOpen(p.id)}
                  onDelete={() => setDeleteTarget(p.id)}
                  onDuplicate={() => duplicateProject(p.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* New project modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Nuevo proyecto">
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre del proyecto"
            placeholder="Mi video musical"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex gap-2 justify-end mt-1">
            <Button variant="ghost" onClick={() => setShowNewModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCreate}>
              <Plus size={14} /> Crear
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar proyecto">
        <p className="text-sm text-white/60 mb-5">
          ¿Estás seguro? Esta acción no se puede deshacer.
        </p>
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
