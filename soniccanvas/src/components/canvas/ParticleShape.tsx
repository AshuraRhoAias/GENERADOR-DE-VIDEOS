import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore } from '@/store/editorStore'
import type { HeroShapeConfig } from '@/types/project'

interface Props {
  config: HeroShapeConfig
  sourceGeometry: THREE.BufferGeometry
}

// Billboarded quads placed at a sampled subset of the source shape's own
// vertices. Each particle carries its own bass/mid/treble mix (aBandWeights)
// and phase (aSeed), so instead of the whole cloud pulsing in lockstep, each
// particle reacts to a different blend of the spectrum on its own timing.
const PARTICLE_VERTEX_SHADER = /* glsl */ `
  attribute vec3 aBasePos;
  attribute vec3 aNormal;
  attribute float aSeed;
  attribute vec3 aBandWeights;

  uniform float uPointSize;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uTime;
  uniform vec3 uCameraRightLocal;
  uniform vec3 uCameraUpLocal;

  varying vec2 vUv;
  varying float vSeed;
  varying float vReact;

  void main() {
    float react = dot(vec3(uBass, uMid, uTreble), aBandWeights);
    float phase = uTime * (1.4 + aSeed * 2.2) + aSeed * 6.2831;
    float shimmer = sin(phase) * 0.4 * react;
    float pulse = (react + shimmer) * (0.08 + aSeed * 0.28);
    vec3 pos = aBasePos + aNormal * pulse;

    float sizeVar = 0.55 + aSeed * 0.75;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float depthScale = 1.0 / max(0.5, -mv.z);
    float worldSize = uPointSize * sizeVar * depthScale * (0.016 + react * 0.014);

    vec3 offset = (uCameraRightLocal * position.x + uCameraUpLocal * position.y) * worldSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + offset, 1.0);

    vUv = uv;
    vSeed = aSeed;
    vReact = react;
  }
`

const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  varying float vSeed;
  varying float vReact;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float d = length(p);
    float alpha = 1.0 - smoothstep(0.7, 1.0, d);
    if (alpha <= 0.02) discard;

    float core = 1.0 - smoothstep(0.0, 0.6, d);
    vec3 base = mix(uColorA, uColorB, vSeed);
    vec3 color = base * (0.6 + vReact * 0.9) + vec3(1.0) * core * (0.2 + vReact * 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`

/** Per-particle bass/mid/treble mix — biased toward `bias` but randomized enough that particles react to different parts of the spectrum. */
function randomBandWeights(bias: HeroShapeConfig['reactTo']): [number, number, number] {
  const w: [number, number, number] = [Math.random(), Math.random(), Math.random()]
  const idx = bias === 'bass' ? 0 : bias === 'mid' ? 1 : 2
  w[idx] += 1.1
  const sum = w[0] + w[1] + w[2]
  return [w[0] / sum, w[1] / sum, w[2] / sum]
}

function buildParticleGeometry(source: THREE.BufferGeometry, bias: HeroShapeConfig['reactTo'], maxCount = 2200) {
  const srcPos = source.attributes.position as THREE.BufferAttribute
  if (!source.attributes.normal) source.computeVertexNormals()
  const srcNormal = source.attributes.normal as THREE.BufferAttribute

  const total = srcPos.count
  const stride = Math.max(1, Math.floor(total / maxCount))
  const count = Math.floor(total / stride)

  const basePos = new Float32Array(count * 3)
  const normal = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const bandWeights = new Float32Array(count * 3)

  for (let i = 0, si = 0; i < count; i++, si += stride) {
    basePos[i * 3] = srcPos.getX(si)
    basePos[i * 3 + 1] = srcPos.getY(si)
    basePos[i * 3 + 2] = srcPos.getZ(si)
    normal[i * 3] = srcNormal.getX(si)
    normal[i * 3 + 1] = srcNormal.getY(si)
    normal[i * 3 + 2] = srcNormal.getZ(si)
    seed[i] = Math.random()
    const [wb, wm, wt] = randomBandWeights(bias)
    bandWeights[i * 3] = wb
    bandWeights[i * 3 + 1] = wm
    bandWeights[i * 3 + 2] = wt
  }

  const geometry = new THREE.InstancedBufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3)
  )
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2))
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1))
  geometry.setAttribute('aBasePos', new THREE.InstancedBufferAttribute(basePos, 3))
  geometry.setAttribute('aNormal', new THREE.InstancedBufferAttribute(normal, 3))
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1))
  geometry.setAttribute('aBandWeights', new THREE.InstancedBufferAttribute(bandWeights, 3))
  geometry.instanceCount = count
  geometry.boundingSphere = null
  geometry.boundingBox = null

  return geometry
}

function smoothBand(current: number, target: number) {
  const attackRate = target > current ? 0.5 : 0.08
  return THREE.MathUtils.lerp(current, target, attackRate)
}

export function ParticleShape({ config, sourceGeometry }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { audioReactive } = useEditorStore()

  const particleGeometry = useMemo(
    () => buildParticleGeometry(sourceGeometry, config.reactTo),
    [sourceGeometry, config.reactTo]
  )
  useEffect(() => () => particleGeometry.dispose(), [particleGeometry])

  // InstancedMesh's own instance matrices are unused (position comes from the
  // aBasePos/aNormal attributes instead) but must be set to identity or the
  // renderer treats every instance as zero-scaled and draws nothing.
  useEffect(() => {
    if (!meshRef.current) return
    const identity = new THREE.Matrix4()
    for (let i = 0; i < particleGeometry.instanceCount; i++) {
      meshRef.current.setMatrixAt(i, identity)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [particleGeometry])

  const uniforms = useMemo(
    () => ({
      uColorA: { value: new THREE.Color(config.colorA) },
      uColorB: { value: new THREE.Color(config.colorB) },
      uPointSize: { value: 6 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uTime: { value: 0 },
      uCameraRightLocal: { value: new THREE.Vector3(1, 0, 0) },
      uCameraUpLocal: { value: new THREE.Vector3(0, 1, 0) },
    }),
    [config.colorA, config.colorB]
  )

  const invRotation = useMemo(() => new THREE.Matrix3(), [])
  const rightWorld = useMemo(() => new THREE.Vector3(), [])
  const upWorld = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }, delta) => {
    if (matRef.current) {
      const u = matRef.current.uniforms
      u.uTime.value += delta
      u.uBass.value = smoothBand(u.uBass.value, audioReactive.bass)
      u.uMid.value = smoothBand(u.uMid.value, audioReactive.mid)
      u.uTreble.value = smoothBand(u.uTreble.value, audioReactive.treble)
    }

    if (meshRef.current && matRef.current) {
      meshRef.current.updateMatrixWorld()
      invRotation.setFromMatrix4(meshRef.current.matrixWorld).invert()
      rightWorld.setFromMatrixColumn(camera.matrixWorld, 0)
      upWorld.setFromMatrixColumn(camera.matrixWorld, 1)
      matRef.current.uniforms.uCameraRightLocal.value.copy(rightWorld).applyMatrix3(invRotation).normalize()
      matRef.current.uniforms.uCameraUpLocal.value.copy(upWorld).applyMatrix3(invRotation).normalize()
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[particleGeometry, undefined, particleGeometry.instanceCount]}
      frustumCulled={false}
    >
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={PARTICLE_VERTEX_SHADER}
        fragmentShader={PARTICLE_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}
