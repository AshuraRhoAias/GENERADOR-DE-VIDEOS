import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore } from '@/store/editorStore'
import type { HeroShapeConfig } from '@/types/project'

interface Props {
  config: HeroShapeConfig
}

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  uniform float uReact;
  varying vec3 vNormal;
  varying vec3 vPos;

  void main() {
    float flow = sin(vPos.x * 1.6 + vPos.y * 1.2 + uTime * 0.6) * 0.5 + 0.5;
    vec3 base = mix(uColorA, uColorB, flow);

    vec3 viewDir = normalize(cameraPosition - vPos);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.2);

    vec3 color = base + fresnel * (0.6 + uReact * 0.7);
    color += base * uReact * 0.5;

    gl_FragColor = vec4(color, 1.0);
  }
`

export function HeroShape({ config }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { audioReactive } = useEditorStore()

  const uniforms = useMemo(
    () => ({
      uColorA: { value: new THREE.Color(config.colorA) },
      uColorB: { value: new THREE.Color(config.colorB) },
      uTime: { value: 0 },
      uReact: { value: 0 },
    }),
    [config.colorA, config.colorB]
  )

  const geomArgs = useMemo<[number, number, number, number, number, number]>(
    () =>
      config.type === 'sphereKnot'
        ? [0.9, 0.4, 200, 24, config.knotP, config.knotQ]
        : [1, 0.32, 220, 32, config.knotP, config.knotQ],
    [config.type, config.knotP, config.knotQ]
  )

  useFrame((_, delta) => {
    const reactValue = audioReactive[config.reactTo]

    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta
      matRef.current.uniforms.uReact.value = THREE.MathUtils.lerp(
        matRef.current.uniforms.uReact.value,
        reactValue,
        0.15
      )
    }

    if (groupRef.current) {
      const spin = 0.15 + reactValue * 0.6
      groupRef.current.rotation.y += delta * spin
      groupRef.current.rotation.x += delta * spin * 0.4

      const target = audioReactive.kick ? 1.08 : 1
      groupRef.current.scale.lerp(
        new THREE.Vector3(target, target, target),
        0.25
      )
    }
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <torusKnotGeometry args={geomArgs} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
        />
      </mesh>
      <mesh scale={1.015}>
        <torusKnotGeometry args={geomArgs} />
        <meshBasicMaterial
          color={config.wireframeColor}
          wireframe
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
