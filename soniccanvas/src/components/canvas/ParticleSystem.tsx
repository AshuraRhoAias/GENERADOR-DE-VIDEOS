import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore } from '@/store/editorStore'
import type { ParticleConfig } from '@/types/project'

interface Props {
  config: ParticleConfig
}

export function ParticleSystem({ config }: Props) {
  const meshRef = useRef<THREE.Points>(null)
  const { audioReactive } = useEditorStore()

  const { positions, velocities } = useMemo(() => {
    const count = config.count
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5
      velocities[i * 3]     = (Math.random() - 0.5) * 0.005
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005
      velocities[i * 3 + 2] = 0
    }
    return { positions, velocities }
  }, [config.count])

  useFrame(() => {
    if (!meshRef.current) return
    const geo = meshRef.current.geometry
    const pos = geo.attributes.position.array as Float32Array
    const reactValue = audioReactive[config.reactTo]
    const energy = 1 + reactValue * 3

    for (let i = 0; i < config.count; i++) {
      pos[i * 3]     += velocities[i * 3] * energy
      pos[i * 3 + 1] += velocities[i * 3 + 1] * energy
      // wrap around
      if (pos[i * 3] > 5)  pos[i * 3] = -5
      if (pos[i * 3] < -5) pos[i * 3] = 5
      if (pos[i * 3 + 1] > 3)  pos[i * 3 + 1] = -3
      if (pos[i * 3 + 1] < -3) pos[i * 3 + 1] = 3
    }
    geo.attributes.position.needsUpdate = true

    // Scale particles on beat
    const mat = meshRef.current.material as THREE.PointsMaterial
    mat.size = config.size * (1 + reactValue * 2)
  })

  const color = useMemo(() => new THREE.Color(config.color), [config.color])

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={config.size}
        color={color}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  )
}
