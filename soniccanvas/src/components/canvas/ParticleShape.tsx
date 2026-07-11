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

    // Gentle ember-like flicker, always a little alive even in silence.
    float flickerPhase = uTime * (0.6 + aSeed * 1.0) + aSeed * 17.0;
    pos.y += sin(flickerPhase) * (0.015 + react * 0.05);

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

/** Assembles the InstancedBufferGeometry shared by every particle-sampling strategy below. */
function assembleParticleGeometry(basePos: Float32Array, normal: Float32Array, seed: Float32Array, bandWeights: Float32Array, count: number) {
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

// Surface-tessellated geometries (TorusKnot, Cone) carry vertices spread
// across their whole surface, so sampling the mesh's own vertices gives a
// well-filled particle cloud. Random sample (Fisher-Yates) rather than a
// fixed stride: a fixed stride can alias with a geometry's internal vertex
// block layout and sample from only one sliver of the shape.
function buildParticleGeometry(source: THREE.BufferGeometry, bias: HeroShapeConfig['reactTo'], maxCount = 2200) {
  const srcPos = source.attributes.position as THREE.BufferAttribute
  if (!source.attributes.normal) source.computeVertexNormals()
  const srcNormal = source.attributes.normal as THREE.BufferAttribute

  const total = srcPos.count
  const count = Math.min(total, maxCount)

  const indices = Array.from({ length: total }, (_, i) => i)
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = indices[i]
    indices[i] = indices[j]
    indices[j] = tmp
  }

  const basePos = new Float32Array(count * 3)
  const normal = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const bandWeights = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const si = indices[i]
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

  return assembleParticleGeometry(basePos, normal, seed, bandWeights, count)
}

const HEART_SHAPE_POINTS = (() => {
  const shape = new THREE.Shape()
  shape.moveTo(0, -1.1)
  shape.bezierCurveTo(-1.6, 0.2, -1.6, 1.35, -0.6, 1.35)
  shape.bezierCurveTo(-0.05, 1.35, 0, 0.85, 0, 0.85)
  shape.bezierCurveTo(0, 0.85, 0.05, 1.35, 0.6, 1.35)
  shape.bezierCurveTo(1.6, 1.35, 1.6, 0.2, 0, -1.1)
  return shape.getPoints(48)
})()

const HEART_SCALE = 0.75
// Matches ExtrudeGeometry(shape).center()'s vertical shift for this outline
// (bounding box spans y: -1.1..1.35, so its center sits at y=0.125).
const HEART_CENTER_Y = 0.125
const HEART_DEPTH = 0.95

// ExtrudeGeometry only carries vertices on the shape's boundary curve (front
// cap, back cap and side wall all reuse the same outline points) — it never
// tessellates the interior. Sampling those vertices for particles produces a
// sparse outline-only cloud that reads as a couple of thin curved streaks
// instead of a filled heart. Fill it properly instead: triangulate the 2D
// heart outline and scatter particles uniformly across the triangle area
// (area-weighted so points don't cluster on the tiny sliver triangles),
// giving each one a shallow random depth for volume.
function buildHeartParticleGeometry(bias: HeroShapeConfig['reactTo'], count = 2600) {
  const pts = HEART_SHAPE_POINTS
  const tris = THREE.ShapeUtils.triangulateShape(pts, [])

  const areas: number[] = []
  let totalArea = 0
  for (const [a, b, c] of tris) {
    const pa = pts[a], pb = pts[b], pc = pts[c]
    const area = Math.abs((pb.x - pa.x) * (pc.y - pa.y) - (pc.x - pa.x) * (pb.y - pa.y)) / 2
    areas.push(area)
    totalArea += area
  }

  const basePos = new Float32Array(count * 3)
  const normal = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const bandWeights = new Float32Array(count * 3)
  const dir = new THREE.Vector3()

  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalArea
    let ti = 0
    for (; ti < areas.length - 1; ti++) {
      r -= areas[ti]
      if (r <= 0) break
    }
    const [a, b, c] = tris[ti]
    const pa = pts[a], pb = pts[b], pc = pts[c]
    let u = Math.random()
    let v = Math.random()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    const x = pa.x + u * (pb.x - pa.x) + v * (pc.x - pa.x)
    const y = pa.y + u * (pb.y - pa.y) + v * (pc.y - pa.y) - HEART_CENTER_Y
    const z = (Math.random() - 0.5) * HEART_DEPTH

    basePos[i * 3] = x * HEART_SCALE
    basePos[i * 3 + 1] = y * HEART_SCALE
    basePos[i * 3 + 2] = z * HEART_SCALE

    dir.set(x, y, z * 1.6).normalize()
    normal[i * 3] = dir.x
    normal[i * 3 + 1] = dir.y
    normal[i * 3 + 2] = dir.z

    seed[i] = Math.random()
    const [wb, wm, wt] = randomBandWeights(bias)
    bandWeights[i * 3] = wb
    bandWeights[i * 3 + 1] = wm
    bandWeights[i * 3 + 2] = wt
  }

  return assembleParticleGeometry(basePos, normal, seed, bandWeights, count)
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
    () =>
      config.type === 'heart'
        ? buildHeartParticleGeometry(config.reactTo)
        : buildParticleGeometry(sourceGeometry, config.reactTo),
    [sourceGeometry, config.reactTo, config.type]
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
      uPointSize: { value: 12 },
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
