import { useState } from 'react'
import { Plus, Trash2, Clock, FileText } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useEditorStore } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { LyricLine } from '@/types/project'

function timeToSec(str: string): number {
  const parts = str.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return Number(str) || 0
}

function secToTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(1).padStart(4, '0')
  return `${m}:${s}`
}

export function LyricsEditor() {
  const { openProject, updateOpenProject } = useProjectStore()
  const { currentTime } = useEditorStore()
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')

  const lines = openProject?.lyrics ?? []

  const addLine = () => {
    const newLine: LyricLine = { start: currentTime, end: currentTime + 3, text: '' }
    updateOpenProject({ lyrics: [...lines, newLine] })
  }

  const updateLine = (i: number, patch: Partial<LyricLine>) => {
    const updated = lines.map((l, idx) => idx === i ? { ...l, ...patch } : l)
    updateOpenProject({ lyrics: updated })
  }

  const removeLine = (i: number) => {
    updateOpenProject({ lyrics: lines.filter((_, idx) => idx !== i) })
  }

  const handleImport = () => {
    // Parse plain text: each line becomes a lyric with 3s duration
    const newLines: LyricLine[] = importText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, i) => ({ start: i * 3, end: (i + 1) * 3 - 0.1, text }))

    updateOpenProject({ lyrics: newLines })
    setShowImport(false)
    setImportText('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2.5 border-b border-white/8 shrink-0">
        <span className="text-xs text-white/40 font-medium">{lines.length} líneas</span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowImport(true)}
            className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white transition-colors"
            title="Importar texto"
          >
            <FileText size={13} />
          </button>
          <button
            onClick={addLine}
            className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white transition-colors"
            title="Agregar línea"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-white/20">Sin letras</p>
            <button onClick={() => setShowImport(true)} className="text-xs text-violet-400 mt-2 hover:text-violet-300">
              Importar texto
            </button>
          </div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="bg-white/4 rounded-lg p-2 flex flex-col gap-1.5 group">
              <input
                className="w-full bg-transparent text-xs text-white placeholder:text-white/20 border-none outline-none"
                placeholder="Texto de la línea..."
                value={line.text}
                onChange={(e) => updateLine(i, { text: e.target.value })}
              />
              <div className="flex items-center gap-1.5">
                <Clock size={10} className="text-white/20 shrink-0" />
                <input
                  className="w-14 bg-white/5 rounded px-1.5 py-0.5 text-[10px] font-mono text-white/50 text-center border-none outline-none"
                  value={secToTime(line.start)}
                  onChange={(e) => updateLine(i, { start: timeToSec(e.target.value) })}
                  title="Inicio"
                />
                <span className="text-white/20 text-[10px]">→</span>
                <input
                  className="w-14 bg-white/5 rounded px-1.5 py-0.5 text-[10px] font-mono text-white/50 text-center border-none outline-none"
                  value={secToTime(line.end)}
                  onChange={(e) => updateLine(i, { end: timeToSec(e.target.value) })}
                  title="Fin"
                />
                <button
                  onClick={() => updateLine(i, { start: currentTime })}
                  className="text-[9px] text-violet-400 hover:text-violet-300 ml-auto transition-colors"
                  title="Marcar inicio en tiempo actual"
                >
                  Marcar
                </button>
                <button
                  onClick={() => removeLine(i)}
                  className="p-0.5 text-white/15 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={10} />
                </button>
              </div>
              {line.translation !== undefined && (
                <input
                  className="w-full bg-transparent text-[10px] text-white/30 placeholder:text-white/15 border-none outline-none italic"
                  placeholder="Traducción (opcional)..."
                  value={line.translation ?? ''}
                  onChange={(e) => updateLine(i, { translation: e.target.value })}
                />
              )}
            </div>
          ))
        )}
      </div>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Importar letras">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/40">
            Pega el texto de la canción. Cada línea se convierte en una letra con 3 segundos de duración. Puedes ajustar el timing después.
          </p>
          <textarea
            className="w-full h-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 resize-none outline-none focus:border-violet-500 transition-colors"
            placeholder={"Primera línea de la canción\nSegunda línea\nTercera línea..."}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowImport(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleImport} disabled={!importText.trim()}>
              Importar {importText.split('\n').filter(Boolean).length} líneas
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
