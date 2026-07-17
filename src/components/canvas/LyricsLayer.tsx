import { useMemo } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { LyricLine, LyricStyle } from '@/types/project'

interface Props {
  lines: LyricLine[]
  style: LyricStyle
}

export function LyricsOverlay({ lines, style }: Props) {
  const { currentTime, audioReactive } = useEditorStore()

  const activeLine = useMemo(() =>
    lines.find((l) => currentTime >= l.start && currentTime <= l.end),
    [lines, currentTime]
  )

  if (!activeLine) return null

  const progress = activeLine
    ? (currentTime - activeLine.start) / (activeLine.end - activeLine.start)
    : 0

  const bounce = style.animation === 'bounce'
    ? `translateY(${audioReactive.beat ? -6 : 0}px) scale(${1 + audioReactive.bass * 0.04})`
    : undefined

  const glowStyle = style.glow
    ? { textShadow: `0 0 20px ${style.glowColor}, 0 0 40px ${style.glowColor}80` }
    : {}

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 pointer-events-none select-none">
      <div
        style={{
          fontFamily: style.fontFamily,
          transform: bounce,
          transition: 'transform 0.05s ease',
          textAlign: 'center',
          padding: '0 32px',
        }}
      >
        {/* Main lyric */}
        <div
          style={{
            fontSize: `${style.fontSize * 0.6}px`,
            color: style.color,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            position: 'relative',
            ...glowStyle,
          }}
        >
          {style.animation === 'karaoke' ? (
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ color: style.color, opacity: 0.3 }}>{activeLine.text}</span>
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  color: style.glowColor,
                  overflow: 'hidden',
                  width: `${progress * 100}%`,
                  whiteSpace: 'nowrap',
                  ...glowStyle,
                }}
              >
                {activeLine.text}
              </span>
            </span>
          ) : (
            activeLine.text
          )}
        </div>

        {/* Translation */}
        {activeLine.translation && (
          <div
            style={{
              fontSize: `${style.translationSize * 0.6}px`,
              color: style.translationColor,
              marginTop: 8,
              fontWeight: 400,
              opacity: 0.8,
            }}
          >
            {activeLine.translation}
          </div>
        )}
      </div>
    </div>
  )
}
