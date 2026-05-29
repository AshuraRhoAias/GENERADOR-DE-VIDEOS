import { Suspense, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import { Upload, Music } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useEditorStore } from '@/store/editorStore'

function Scene() {
  const { openProject } = useProjectStore()
  const bg = openProject?.background

  const bgColor = bg?.type === 'color' ? (bg.color ?? '#0a0a0f') : '#0a0a0f'

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#7c3aed" />
      <Stars radius={80} depth={50} count={1000} factor={3} fade speed={0.5} />
      <Environment preset="night" />
      <OrbitControls makeDefault enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}

export function Viewport() {
  const { openProject, updateOpenProject } = useProjectStore()
  const { setAudioFile, setDuration } = useEditorStore()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const audio = files.find((f) => f.type.startsWith('audio/'))
    const image = files.find((f) => f.type.startsWith('image/'))

    if (audio) {
      setAudioFile(audio)
      const url = URL.createObjectURL(audio)
      const a = new Audio(url)
      a.onloadedmetadata = () => {
        setDuration(a.duration)
        updateOpenProject({ audio: { url, localPath: audio.name, offset: 0 }, duration: a.duration })
      }
    }
    if (image && openProject) {
      const url = URL.createObjectURL(image)
      updateOpenProject({ background: { ...openProject.background, type: 'image', url } })
    }
  }, [openProject, updateOpenProject, setAudioFile, setDuration])

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const hasAudio = !!openProject?.audio?.localPath

  return (
    <div
      className="relative flex-1 bg-[#0a0a0f] overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Aspect ratio container 16:9 */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl" style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 rounded-lg overflow-hidden ring-1 ring-white/10 shadow-2xl">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 60 }}
              gl={{ antialias: true, alpha: false }}
              dpr={[1, 2]}
            >
              <Suspense fallback={null}>
                <Scene />
              </Suspense>
            </Canvas>
          </div>
        </div>
      </div>

      {/* Drop overlay when no audio */}
      {!hasAudio && (
        <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none">
          <div className="flex items-center gap-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                <Music size={18} className="text-violet-400" />
              </div>
              <p className="text-xs text-white/40">Arrastra tu <span className="text-white/70">audio</span> aquí</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                <Upload size={18} className="text-blue-400" />
              </div>
              <p className="text-xs text-white/40">O una <span className="text-white/70">imagen</span> de fondo</p>
            </div>
          </div>
        </div>
      )}

      {/* Canvas overlay label */}
      <div className="absolute top-3 left-3 text-[10px] text-white/20 font-mono bg-black/40 px-2 py-1 rounded">
        1920 × 1080 · 30fps
      </div>
    </div>
  )
}
