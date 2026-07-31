import { Suspense, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Upload, Music } from 'lucide-react'
import * as THREE from 'three'
import { useProjectStore, DEFAULT_HERO_SHAPE } from '@/store/projectStore'
import { useEditorStore } from '@/store/editorStore'
import { audioAnalyzer } from '@/lib/audioAnalyzer'
import { ParticleSystem } from './ParticleSystem'
import { HeroShape } from './HeroShape'
import { LyricsOverlay } from './LyricsLayer'
import { Spectrum3DShape } from './Spectrum3DShape'
import { DEFAULT_SPECTRUM3D } from '@/store/projectStore'

function ReactiveAmbientLight() {
  const { audioReactive } = useEditorStore()
  return (
    <>
      <ambientLight intensity={0.3 + audioReactive.bass * 0.4} />
      <pointLight
        position={[0, 2, 3]}
        intensity={0.6 + audioReactive.mid * 1.5}
        color="#7c3aed"
      />
      <pointLight
        position={[-3, -2, 2]}
        intensity={0.3 + audioReactive.treble * 0.8}
        color="#3b82f6"
      />
    </>
  )
}

function ReactiveBackground({ color }: { color: string }) {
  const { audioReactive } = useEditorStore()
  const base = new THREE.Color(color)

  useFrame(({ scene }) => {
    const boosted = base.clone().multiplyScalar(1 + audioReactive.bass * 0.15)
    scene.background = boosted
  })

  return null
}

function CameraShake() {
  const { audioReactive } = useEditorStore()

  useFrame(({ camera }) => {
    if (audioReactive.kick) {
      camera.position.x += (Math.random() - 0.5) * 0.04
      camera.position.y += (Math.random() - 0.5) * 0.04
    } else {
      camera.position.x *= 0.92
      camera.position.y *= 0.92
    }
  })

  return null
}

function Scene() {
  const { openProject } = useProjectStore()
  const currentTime = useEditorStore((s) => s.currentTime)
  const bg = openProject?.background
  const bgColor = bg?.type === 'color' ? (bg.color ?? '#0a0a0f') : '#0a0a0f'

  const activeBlock = openProject?.shapeTimeline?.find(
    (b) => currentTime >= b.start && currentTime < b.end
  )
  const heroShape = activeBlock
    ? { enabled: true, ...activeBlock }
    : (openProject?.heroShape ?? DEFAULT_HERO_SHAPE)

  return (
    <>
      <ReactiveBackground color={bgColor} />
      <ReactiveAmbientLight />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <Stars radius={80} depth={50} count={1500} factor={3} fade speed={0.3} />

      {openProject?.particles?.enabled && (
        <ParticleSystem config={openProject.particles} />
      )}

      {heroShape.enabled && <HeroShape config={heroShape} />}

      <Spectrum3DShape config={openProject?.spectrum3d ?? DEFAULT_SPECTRUM3D} />

      <hemisphereLight args={['#1a0a3a', '#000000', 0.6]} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={3}
        maxDistance={14}
        autoRotate
        autoRotateSpeed={0.2}
      />
      <CameraShake />

      {heroShape.enabled && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.4} luminanceSmoothing={0.6} intensity={1.1} mipmapBlur radius={0.6} />
        </EffectComposer>
      )}
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
      audioAnalyzer.loadFile(audio).then((buf) => {
        setDuration(buf.duration)
        updateOpenProject({
          audio: { url: null, localPath: audio.name, offset: 0 },
          duration: buf.duration,
        })
      })
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
      className="relative flex-1 bg-surface-0 overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl" style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 rounded-lg overflow-hidden ring-1 ring-white/10 shadow-2xl">
            <Canvas
              camera={{ position: [0, 0, 7], fov: 55 }}
              gl={{ antialias: true, alpha: false }}
              dpr={[1, 2]}
            >
              <Suspense fallback={null}>
                <Scene />
              </Suspense>
            </Canvas>

            {/* Lyrics overlay (HTML over canvas) */}
            {openProject?.lyrics && openProject.lyrics.length > 0 && (
              <LyricsOverlay
                lines={openProject.lyrics}
                style={openProject.lyricStyle}
              />
            )}
          </div>
        </div>
      </div>

      {/* Drop hint when no audio */}
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

      <div className="absolute top-3 left-3 text-[10px] text-white/20 font-mono bg-black/40 px-2 py-1 rounded">
        1920 × 1080 · 30fps
      </div>

      {hasAudio && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded text-[10px] text-green-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {openProject?.audio?.localPath}
        </div>
      )}
    </div>
  )
}
