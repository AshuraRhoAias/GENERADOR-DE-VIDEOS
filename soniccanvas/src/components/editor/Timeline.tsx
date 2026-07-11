import { useRef, useMemo, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { audioAnalyzer } from '@/lib/audioAnalyzer'
import type { ShapeBlock } from '@/types/project'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const SHAPE_LABELS: Record<ShapeBlock['type'], string> = {
  torusKnot: '🌀 Nudo',
  sphereKnot: '🔮 Orbe',
  heart: '💜 Corazón',
  fire: '🔥 Fuego',
  gearHeart: '⚙️ Mecánico',
}

const MIN_BLOCK_DURATION = 0.4
const DEFAULT_BLOCK_BEATS = 4

type DragMode =
  | { kind: 'create' }
  | { kind: 'move'; blockId: string; anchorTime: number; origStart: number; origEnd: number }
  | { kind: 'resize-left'; blockId: string; origEnd: number }
  | { kind: 'resize-right'; blockId: string; origStart: number }

export function Timeline() {
  const { isPlaying, currentTime, duration, setCurrentTime, audioReactive, selectedShapeBlockId, setSelectedShapeBlockId } = useEditorStore()
  const { openProject, updateOpenProject } = useProjectStore()
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragMode, setDragMode] = useState<DragMode | null>(null)
  const [draft, setDraft] = useState<{ anchor: number; start: number; end: number } | null>(null)

  const shapeTimeline = useMemo(() => openProject?.shapeTimeline ?? [], [openProject?.shapeTimeline])
  const bpm = openProject?.bpm ?? 120
  const beatDuration = 60 / bpm

  const beatTimes = useMemo(() => {
    if (!duration || beatDuration <= 0) return []
    const times: number[] = []
    const maxTicks = 4000
    for (let t = 0, i = 0; t <= duration && i < maxTicks; t += beatDuration, i++) {
      times.push(t)
    }
    return times
  }, [duration, beatDuration])

  const snapToBeat = (t: number) => {
    if (beatDuration <= 0) return t
    return Math.max(0, Math.min(duration, Math.round(t / beatDuration) * beatDuration))
  }

  const timeFromX = (clientX: number) => {
    if (!trackRef.current || !duration) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return ratio * duration
  }

  const updateBlock = (id: string, patch: Partial<ShapeBlock>) => {
    updateOpenProject({
      shapeTimeline: shapeTimeline.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })
  }

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    const newTime = timeFromX(e.clientX)
    setCurrentTime(newTime)
    if (isPlaying) {
      audioAnalyzer.play(newTime)
    }
  }

  const handleShapesPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return
    const raw = timeFromX(e.clientX)
    const t = e.altKey ? raw : snapToBeat(raw)
    setDraft({ anchor: t, start: t, end: t })
    setDragMode({ kind: 'create' })
    setSelectedShapeBlockId(null)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleBlockPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    block: ShapeBlock,
    kind: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.stopPropagation()
    setSelectedShapeBlockId(block.id)
    if (kind === 'move') {
      setDragMode({ kind, blockId: block.id, anchorTime: timeFromX(e.clientX), origStart: block.start, origEnd: block.end })
    } else if (kind === 'resize-left') {
      setDragMode({ kind, blockId: block.id, origEnd: block.end })
    } else {
      setDragMode({ kind, blockId: block.id, origStart: block.start })
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handleShapesPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragMode || !duration) return
    const raw = timeFromX(e.clientX)
    const snap = !e.altKey

    if (dragMode.kind === 'create') {
      const t = snap ? snapToBeat(raw) : raw
      setDraft((d) => (d ? { anchor: d.anchor, start: Math.min(d.anchor, t), end: Math.max(d.anchor, t) } : d))
      return
    }

    if (dragMode.kind === 'move') {
      const len = dragMode.origEnd - dragMode.origStart
      let newStart = dragMode.origStart + (raw - dragMode.anchorTime)
      if (snap) newStart = snapToBeat(newStart)
      newStart = Math.max(0, Math.min(duration - len, newStart))
      updateBlock(dragMode.blockId, { start: newStart, end: newStart + len })
      return
    }

    if (dragMode.kind === 'resize-left') {
      let newStart = snap ? snapToBeat(raw) : raw
      newStart = Math.max(0, Math.min(newStart, dragMode.origEnd - MIN_BLOCK_DURATION))
      updateBlock(dragMode.blockId, { start: newStart })
      return
    }

    let newEnd = snap ? snapToBeat(raw) : raw
    newEnd = Math.min(duration, Math.max(newEnd, dragMode.origStart + MIN_BLOCK_DURATION))
    updateBlock(dragMode.blockId, { end: newEnd })
  }

  const handleShapesPointerUp = () => {
    if (dragMode?.kind === 'create' && draft) {
      const { start } = draft
      let { end } = draft
      if (end - start < MIN_BLOCK_DURATION) {
        end = Math.min(duration, start + DEFAULT_BLOCK_BEATS * beatDuration)
      }
      const newBlock: ShapeBlock = {
        id: 'shape_' + Date.now(),
        start,
        end,
        type: 'torusKnot',
        style: 'solid',
        colorA: '#a855f7',
        colorB: '#22d3ee',
        wireframeColor: '#67e8f9',
        knotP: 2,
        knotQ: 5,
        reactTo: 'bass',
      }
      updateOpenProject({ shapeTimeline: [...shapeTimeline, newBlock] })
      setSelectedShapeBlockId(newBlock.id)
    }
    setDraft(null)
    setDragMode(null)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Static waveform seed — stable across renders
  const waveform = useMemo(() =>
    Array.from({ length: 200 }, (_, i) =>
      20 + Math.sin(i * 0.3) * 12 + Math.sin(i * 0.7) * 8 + Math.sin(i * 1.3) * 4
    ),
  [])

  const beatScale = 1 + audioReactive.bass * 0.3

  return (
    <div className="h-24 bg-surface-1 border-t border-white/8 flex flex-col shrink-0 select-none">
      <div ref={trackRef} className="relative flex-1 flex flex-col">
        {/* Beat grid — spans both rows, aligned to BPM */}
        {duration > 0 && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {beatTimes.map((t, i) => {
              const isBar = i % 4 === 0
              if (!isBar && beatTimes.length > 400) return null
              return (
                <div
                  key={i}
                  className={isBar ? 'absolute top-0 bottom-0 w-px bg-white/10' : 'absolute top-0 bottom-0 w-px bg-white/[0.04]'}
                  style={{ left: `${(t / duration) * 100}%` }}
                />
              )
            })}
          </div>
        )}

        {/* Waveform / scrubber row */}
        <div
          className="flex-1 relative cursor-pointer group"
          onClick={handleBarClick}
        >
          {/* Waveform */}
          {duration > 0 && (
            <div className="absolute inset-y-2 inset-x-0 flex items-center gap-px px-1 pointer-events-none">
              {waveform.map((h, i) => {
                const filled = (i / waveform.length) * 100 < progress
                const scaledH = h * (filled ? beatScale : 1)
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-none ${filled ? 'bg-violet-500/60' : 'bg-white/10'}`}
                    style={{ height: `${scaledH}px` }}
                  />
                )
              })}
            </div>
          )}

          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full bg-violet-500/8 pointer-events-none"
            style={{ width: `${progress}%` }}
          />

          {/* Beat flash */}
          {audioReactive.beat && (
            <div className="absolute inset-0 bg-violet-500/5 pointer-events-none" />
          )}

          {/* Time labels */}
          <div className="absolute bottom-1 left-2 text-[10px] text-white/30 font-mono pointer-events-none">
            {formatTime(currentTime)}
          </div>
          <div className="absolute bottom-1 right-2 text-[10px] text-white/30 font-mono pointer-events-none">
            {formatTime(duration)}
          </div>

          {/* Play/Pause click shortcut hint */}
          {!duration && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/15">Arrastra un audio al canvas para empezar</span>
            </div>
          )}
        </div>

        {/* Shapes track */}
        <div
          className="h-9 relative border-t border-white/6 bg-black/10 cursor-crosshair"
          onPointerDown={handleShapesPointerDown}
          onPointerMove={handleShapesPointerMove}
          onPointerUp={handleShapesPointerUp}
        >
          <span className="absolute top-1 left-1.5 text-[8px] text-white/20 uppercase tracking-wider pointer-events-none">
            Formas
          </span>

          <div
            className="absolute top-0.5 right-1.5 flex items-center gap-1 z-10"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="text-[8px] text-white/20 uppercase tracking-wider">BPM</span>
            <input
              type="number"
              min={40}
              max={300}
              value={bpm}
              onChange={(e) => updateOpenProject({ bpm: Math.max(40, Math.min(300, Number(e.target.value) || 120)) })}
              className="w-11 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[9px] text-white/60 text-center focus:border-violet-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {duration > 0 && shapeTimeline.map((block) => {
            const left = (block.start / duration) * 100
            const width = ((block.end - block.start) / duration) * 100
            const selected = block.id === selectedShapeBlockId
            return (
              <div
                key={block.id}
                onPointerDown={(e) => handleBlockPointerDown(e, block, 'move')}
                className={`absolute top-2 bottom-1 rounded-md border cursor-grab active:cursor-grabbing overflow-hidden ${
                  selected ? 'border-white/70 ring-1 ring-white/50 z-10' : 'border-white/15 z-0'
                }`}
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 1.2)}%`,
                  background: `linear-gradient(90deg, ${block.colorA}, ${block.colorB})`,
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize hover:bg-white/20"
                  onPointerDown={(e) => handleBlockPointerDown(e, block, 'resize-left')}
                />
                <div
                  className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize hover:bg-white/20"
                  onPointerDown={(e) => handleBlockPointerDown(e, block, 'resize-right')}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white/90 truncate px-2 pointer-events-none drop-shadow">
                  {SHAPE_LABELS[block.type]}
                </span>
              </div>
            )
          })}

          {/* In-progress creation preview */}
          {draft && duration > 0 && (
            <div
              className="absolute top-2 bottom-1 rounded-md border border-dashed border-white/40 bg-white/10 pointer-events-none"
              style={{
                left: `${(draft.start / duration) * 100}%`,
                width: `${Math.max(((draft.end - draft.start) / duration) * 100, 0.3)}%`,
              }}
            />
          )}

          {!duration && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[9px] text-white/15">Arrastra aquí para programar una figura 3D</span>
            </div>
          )}
        </div>

        {/* Playhead — spans both rows */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-violet-400 pointer-events-none shadow-[0_0_6px_#7c3aed] z-20"
          style={{ left: `${progress}%` }}
        >
          <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-violet-400 rotate-45" />
        </div>
      </div>
    </div>
  )
}
