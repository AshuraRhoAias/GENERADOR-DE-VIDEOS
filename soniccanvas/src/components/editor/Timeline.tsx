import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Timeline() {
  const { isPlaying, currentTime, duration, setCurrentTime, setPlaying } = useEditorStore()
  const { openProject } = useProjectStore()
  const barRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const baseTimeRef = useRef<number>(0)

  useEffect(() => {
    if (isPlaying) {
      startRef.current = performance.now()
      baseTimeRef.current = currentTime

      const tick = (now: number) => {
        const elapsed = (now - startRef.current) / 1000
        const next = baseTimeRef.current + elapsed
        if (next >= duration && duration > 0) {
          setCurrentTime(0)
          setPlaying(false)
          return
        }
        setCurrentTime(next)
        animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(animRef.current)
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [isPlaying])

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || !duration) return
    const rect = barRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = ratio * duration
    setCurrentTime(newTime)
    baseTimeRef.current = newTime
    startRef.current = performance.now()
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="h-16 bg-[#0e0e16] border-t border-white/8 flex flex-col shrink-0 select-none">
      {/* Waveform area */}
      <div
        ref={barRef}
        className="flex-1 relative cursor-pointer group"
        onClick={handleBarClick}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-white/4 last:border-0" />
          ))}
        </div>

        {/* Waveform placeholder */}
        {openProject?.audio?.localPath && (
          <div className="absolute inset-y-2 inset-x-0 flex items-center gap-px px-1">
            {Array.from({ length: 200 }).map((_, i) => {
              const h = 20 + Math.sin(i * 0.3) * 12 + Math.sin(i * 0.7) * 8 + Math.random() * 4
              return (
                <div
                  key={i}
                  className="flex-1 bg-violet-500/30 rounded-sm"
                  style={{ height: `${h}px` }}
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

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-violet-400 pointer-events-none shadow-[0_0_6px_#7c3aed]"
          style={{ left: `${progress}%` }}
        >
          <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-violet-400 rotate-45" />
        </div>

        {/* Time labels */}
        <div className="absolute bottom-1 left-2 text-[10px] text-white/30 font-mono">
          {formatTime(currentTime)}
        </div>
        <div className="absolute bottom-1 right-2 text-[10px] text-white/30 font-mono">
          {formatTime(duration)}
        </div>
      </div>
    </div>
  )
}
