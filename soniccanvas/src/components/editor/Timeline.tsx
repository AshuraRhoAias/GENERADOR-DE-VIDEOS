import { useRef, useMemo } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { audioAnalyzer } from '@/lib/audioAnalyzer'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Timeline() {
  const { isPlaying, currentTime, duration, setCurrentTime, audioReactive } = useEditorStore()
  const barRef = useRef<HTMLDivElement>(null)

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || !duration) return
    const rect = barRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = ratio * duration
    setCurrentTime(newTime)
    if (isPlaying) {
      audioAnalyzer.play(newTime)
    }
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
    <div className="h-16 bg-surface-1 border-t border-white/8 flex flex-col shrink-0 select-none">
      <div
        ref={barRef}
        className="flex-1 relative cursor-pointer group"
        onClick={handleBarClick}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 flex pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-white/4 last:border-0" />
          ))}
        </div>

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

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-violet-400 pointer-events-none shadow-[0_0_6px_#7c3aed]"
          style={{ left: `${progress}%` }}
        >
          <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-violet-400 rotate-45" />
        </div>

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
    </div>
  )
}
