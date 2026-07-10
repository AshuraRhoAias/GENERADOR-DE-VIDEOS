import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore } from '@/store/editorStore'
import type { HeroShapeConfig } from '@/types/project'

interface Props {
  config: HeroShapeConfig
}

// Shared by the solid mesh and the wireframe overlay so both ripple in lockstep.
const DISPLACED_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uReact;
  varying vec3 vNormal;
  varying vec3 vPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);

    float ripple =
      sin(position.x * 6.0 + position.y * 4.0 + uTime * 3.2) * 0.045 +
      sin(position.y * 9.0 - position.z * 5.0 + uTime * 5.1) * 0.03;
    vec3 displaced = position + normal * ripple * uReact;

    vPos = displaced;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
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

const WIRE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uWireColor;
  uniform float uReact;

  void main() {
    gl_FragColor = vec4(uWireColor, 0.16 + uReact * 0.55);
  }
`

function buildKnotGeometry(type: HeroShapeConfig['type'], p: number, q: number) {
  return type === 'sphereKnot'
    ? new THREE.TorusKnotGeometry(0.9, 0.4, 200, 24, p, q)
    : new THREE.TorusKnotGeometry(1, 0.32, 220, 32, p, q)
}

function buildHeartGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, -1.1)
  shape.bezierCurveTo(-1.6, 0.2, -1.6, 1.35, -0.6, 1.35)
  shape.bezierCurveTo(-0.05, 1.35, 0, 0.85, 0, 0.85)
  shape.bezierCurveTo(0, 0.85, 0.05, 1.35, 0.6, 1.35)
  shape.bezierCurveTo(1.6, 1.35, 1.6, 0.2, 0, -1.1)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.7,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelSegments: 8,
    curveSegments: 32,
  })
  geometry.center()
  geometry.scale(0.75, 0.75, 0.75)
  geometry.computeVertexNormals()
  return geometry
}

function buildFireGeometry() {
  const geometry = new THREE.ConeGeometry(0.85, 2.4, 40, 20, true)
  const pos = geometry.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const heightRatio = (v.y + 1.2) / 2.4 // 0 at base, 1 at tip
    const taperNoise =
      Math.sin(v.x * 7 + v.z * 5) * 0.12 +
      Math.sin(v.x * 13 - v.z * 9 + heightRatio * 8) * 0.08
    const flicker = 1 + taperNoise * (1 - heightRatio * 0.6)
    v.x *= flicker
    v.z *= flicker
    v.y += Math.sin(v.x * 4 + v.z * 4) * 0.06 * heightRatio
    pos.setXYZ(i, v.x, v.y, v.z)
  }

  geometry.translate(0, -0.2, 0)
  geometry.computeVertexNormals()
  return geometry
}

function buildGeometry(type: HeroShapeConfig['type'], knotP: number, knotQ: number) {
  switch (type) {
    case 'heart':
      return buildHeartGeometry()
    case 'fire':
      return buildFireGeometry()
    default:
      return buildKnotGeometry(type, knotP, knotQ)
  }
}

export function HeroShape({ config }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const wireMatRef = useRef<THREE.ShaderMaterial>(null)
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

  const wireUniforms = useMemo(
    () => ({
      uWireColor: { value: new THREE.Color(config.wireframeColor) },
      uTime: { value: 0 },
      uReact: { value: 0 },
    }),
    [config.wireframeColor]
  )

  const geometry = useMemo(
    () => buildGeometry(config.type, config.knotP, config.knotQ),
    [config.type, config.knotP, config.knotQ]
  )

  useEffect(() => () => geometry.dispose(), [geometry])

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

    // Mirror onto the wireframe overlay so both surfaces ripple in lockstep.
    if (wireMatRef.current && matRef.current) {
      wireMatRef.current.uniforms.uTime.value = matRef.current.uniforms.uTime.value
      wireMatRef.current.uniforms.uReact.value = matRef.current.uniforms.uReact.value
    }

    if (groupRef.current) {
      const isFlatShape = config.type === 'heart'
      const spin = config.type === 'fire' ? 0.05 + reactValue * 0.2 : 0.15 + reactValue * 0.6
      groupRef.current.rotation.y += delta * spin
      if (config.type !== 'fire' && !isFlatShape) {
        groupRef.current.rotation.x += delta * spin * 0.4
      }

      const target = audioReactive.kick ? 1.08 : 1
      groupRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.25)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={DISPLACED_VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
        />
      </mesh>
      <mesh geometry={geometry} scale={1.015}>
        <shaderMaterial
          ref={wireMatRef}
          uniforms={wireUniforms}
          vertexShader={DISPLACED_VERTEX_SHADER}
          fragmentShader={WIRE_FRAGMENT_SHADER}
          wireframe
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
