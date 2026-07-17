import { useEffect, useRef } from 'react'
import { audioAnalyzer } from '@/lib/audioAnalyzer'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'

export function useAudioReactive() {
  const { isPlaying, currentTime, setCurrentTime, setDuration, updateReactive, setAudioBuffer } = useEditorStore()
  const { openProject } = useProjectStore()
  const rafRef = useRef<number>(0)
  const loadedFile = useRef<string | null>(null)

  // Load audio when project audio changes
  useEffect(() => {
    const audioPath = openProject?.audio?.localPath
    if (!audioPath || loadedFile.current === audioPath) return

    const file = useEditorStore.getState().audioFile
    if (!file) return

    audioAnalyzer.loadFile(file).then((buf) => {
      setAudioBuffer(buf)
      setDuration(buf.duration)
      loadedFile.current = audioPath
    })
  }, [openProject?.audio?.localPath])

  // Play / pause
  useEffect(() => {
    if (isPlaying) {
      audioAnalyzer.play(currentTime)
    } else {
      audioAnalyzer.pause()
    }
  }, [isPlaying])

  // RAF loop for reactive data + time sync
  useEffect(() => {
    const tick = () => {
      if (useEditorStore.getState().isPlaying) {
        const t = audioAnalyzer.getCurrentTime()
        setCurrentTime(t)
        updateReactive(audioAnalyzer.getFrequencyBands())
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])
}
