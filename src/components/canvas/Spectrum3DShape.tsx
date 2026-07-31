import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore } from '@/store/editorStore'

export interface Spectrum3DConfig {
  enabled: boolean
  bars: number           // 8-32
  colorA: string        // bottom color (e.g. '#7c3aed')
  colorB: string        // top color (e.g. '#fbbf24')
  reactTo: 'bass' | 'mid' | 'treble'
  motionEffect: 'bounce' | 'wave' | 'pulse' | 'spiral'
  scale: number         // 0.5 - 2.0
  posX: number
  posY: number
  glow: boolean
}

export const DEFAULT_SPECTRUM3D: Spectrum3DConfig = {
  enabled: false,
  bars: 16,
  colorA: '#7c3aed',
  colorB: '#fbbf24',
  reactTo: 'bass',
  motionEffect: 'bounce',
  scale: 1.0,
  posX: 0,
  posY: -1.5,
  glow: true,
}

function SpectrumBar({
  index, total, colorA, colorB, motionEffect, reactive, scale
}: {
  index: number; total: number; colorA: THREE.Color; colorB: THREE.Color
  motionEffect: string; reactive: number; scale: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  // Pre-compute static noise per bar so each has its own personality
  const noise = useMemo(() => Math.sin(index * 1.37 + 2.5) * 0.3 + 0.7, [index])
  const phaseOffset = useMemo(() => (index / total) * Math.PI * 2, [index, total])

  const barSpacing = 0.28 * scale
  const startX = -(total * barSpacing) / 2 + barSpacing / 2

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    const baseH = 0.2 * scale + reactive * noise * 2.2 * scale

    let extraH = 0
    if (motionEffect === 'wave') {
      extraH = Math.sin(t * 2.5 + phaseOffset) * reactive * 0.6 * scale
    } else if (motionEffect === 'pulse') {
      extraH = Math.sin(t * 4) * reactive * 0.4 * scale
    } else if (motionEffect === 'spiral') {
      extraH = Math.sin(t * 3 + phaseOffset * 2) * reactive * 0.5 * scale
      meshRef.current.rotation.y = t * 0.5 + phaseOffset
    } else {
      // bounce — default
      extraH = Math.abs(Math.sin(t * 3 + phaseOffset)) * reactive * 0.3 * scale
    }

    const finalH = Math.max(0.05 * scale, baseH + extraH)
    meshRef.current.scale.y = finalH
    meshRef.current.position.y = finalH / 2

    // Interpolate color A→B based on height
    const heightRatio = Math.min(1, finalH / (2.5 * scale))
    const c = colorA.clone().lerp(colorB, Math.min(1, heightRatio + reactive * 0.4))
    ;(meshRef.current.material as THREE.MeshStandardMaterial).color = c
    ;(meshRef.current.material as THREE.MeshStandardMaterial).emissive = c.clone().multiplyScalar(0.3 + reactive * 0.4)
  })

  return (
    <mesh
      ref={meshRef}
      position={[startX + index * barSpacing, 0, 0]}
      castShadow
    >
      <boxGeometry args={[0.22 * scale, 1, 0.22 * scale]} />
      <meshStandardMaterial
        color={colorA}
        emissive={colorA}
        emissiveIntensity={0.4}
        roughness={0.2}
        metalness={0.7}
      />
    </mesh>
  )
}

export function Spectrum3DShape({ config }: { config: Spectrum3DConfig }) {
  const { audioReactive } = useEditorStore()
  const groupRef = useRef<THREE.Group>(null)

  const colorA = useMemo(() => new THREE.Color(config.colorA), [config.colorA])
  const colorB = useMemo(() => new THREE.Color(config.colorB), [config.colorB])

  const reactive = audioReactive[config.reactTo]

  // Spiral group rotation
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    if (config.motionEffect === 'spiral') {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.3
    }
  })

  if (!config.enabled) return null

  // Distribute bars into a flat row
  const bars = Math.max(4, Math.min(32, config.bars))

  return (
    <group
      ref={groupRef}
      position={[config.posX, config.posY, 0]}
      scale={[1, 1, 1]}
    >
      {/* Reflection plane */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bars * 0.28 * config.scale + 0.5, 0.8]} />
        <meshStandardMaterial
          color="#000000"
          roughness={0}
          metalness={1}
          opacity={0.4}
          transparent
        />
      </mesh>

      {/* Bars */}
      {Array.from({ length: bars }, (_, i) => (
        <SpectrumBar
          key={i}
          index={i}
          total={bars}
          colorA={colorA}
          colorB={colorB}
          motionEffect={config.motionEffect}
          reactive={reactive}
          scale={config.scale}
        />
      ))}

      {/* Glow point lights */}
      {config.glow && (
        <>
          <pointLight
            position={[0, 1 * config.scale, 1]}
            color={config.colorA}
            intensity={1.5 + reactive * 3}
            distance={6}
          />
          <pointLight
            position={[0, 2 * config.scale, -0.5]}
            color={config.colorB}
            intensity={0.8 + reactive * 2}
            distance={4}
          />
        </>
      )}
    </group>
  )
}
