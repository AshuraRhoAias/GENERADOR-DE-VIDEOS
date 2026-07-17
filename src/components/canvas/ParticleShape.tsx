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
//
// Particles that belong to a "gear" (aRingSpin != 0) orbit their own ring
// center independently instead of sitting at a fixed aBasePos — that's what
// lets the gear-heart's cogs spin at their own speed inside the cloud.
const PARTICLE_VERTEX_SHADER = /* glsl */ `
  attribute vec3 aBasePos;
  attribute vec3 aNormal;
  attribute float aSeed;
  attribute vec3 aBandWeights;
  attribute vec3 aRingCenter;
  attribute float aRingRadius;
  attribute float aRingAngle0;
  attribute float aRingSpin;

  uniform float uPointSize;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uTime;
  uniform float uSpeakerPush;
  uniform vec3 uCameraRightLocal;
  uniform vec3 uCameraUpLocal;

  varying vec2 vUv;
  varying float vSeed;
  varying float vReact;

  void main() {
    float react = dot(vec3(uBass, uMid, uTreble), aBandWeights);

    vec3 restPos = aBasePos;
    if (aRingSpin != 0.0) {
      float angle = aRingAngle0 + uTime * aRingSpin;
      restPos = aRingCenter + vec3(cos(angle), sin(angle), 0.0) * aRingRadius;
    }

    float phase = uTime * (1.4 + aSeed * 2.2) + aSeed * 6.2831;
    float shimmer = sin(phase) * 0.4 * react;
    float pulse = (react + shimmer) * (0.08 + aSeed * 0.28);

    // Subwoofer-cone push: the whole cloud bulges outward from its own
    // rest position on a bass hit, then springs back (and can overshoot
    // slightly inward) as uSpeakerPush decays — "sale y entra" like a
    // speaker diaphragm, layered on top of each particle's own pulse.
    vec3 pos = restPos + aNormal * (pulse + uSpeakerPush * (0.12 + aSeed * 0.1));

    // Constant fine vibration on every particle — always a little alive,
    // more agitated when the shape is reacting.
    float vibPhaseX = uTime * (10.0 + aSeed * 7.0) + aSeed * 41.0;
    float vibPhaseY = uTime * (12.0 + aSeed * 6.0) + aSeed * 23.0;
    float vibAmount = 0.006 + react * 0.03;
    pos.x += sin(vibPhaseX) * vibAmount;
    pos.y += cos(vibPhaseY) * vibAmount;
    pos.z += sin(vibPhaseX * 0.6 + 2.0) * vibAmount;

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

interface RingAttributes {
  center: Float32Array
  radius: Float32Array
  angle0: Float32Array
  spin: Float32Array
}

/** Assembles the InstancedBufferGeometry shared by every particle-sampling strategy below.
 * `ring` is only supplied by shapes with independently-spinning parts (gear-heart's cogs);
 * everything else gets zero-filled ring attributes, which the shader reads as "don't orbit". */
function assembleParticleGeometry(basePos: Float32Array, normal: Float32Array, seed: Float32Array, bandWeights: Float32Array, count: number, ring?: RingAttributes) {
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
  geometry.setAttribute('aRingCenter', new THREE.InstancedBufferAttribute(ring?.center ?? new Float32Array(count * 3), 3))
  geometry.setAttribute('aRingRadius', new THREE.InstancedBufferAttribute(ring?.radius ?? new Float32Array(count), 1))
  geometry.setAttribute('aRingAngle0', new THREE.InstancedBufferAttribute(ring?.angle0 ?? new Float32Array(count), 1))
  geometry.setAttribute('aRingSpin', new THREE.InstancedBufferAttribute(ring?.spin ?? new Float32Array(count), 1))
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

interface ParticleChunk {
  basePos: Float32Array
  normal: Float32Array
  seed: Float32Array
  bandWeights: Float32Array
  ringCenter: Float32Array
  ringRadius: Float32Array
  ringAngle0: Float32Array
  ringSpin: Float32Array
  count: number
}

// ExtrudeGeometry only carries vertices on the shape's boundary curve (front
// cap, back cap and side wall all reuse the same outline points) — it never
// tessellates the interior. Sampling those vertices for particles produces a
// sparse outline-only cloud that reads as a couple of thin curved streaks
// instead of a filled heart. Fill it properly instead: triangulate the 2D
// heart outline and scatter particles uniformly across the triangle area
// (area-weighted so points don't cluster on the tiny sliver triangles),
// giving each one a shallow random depth for volume. `scaleMul` lets the
// gear-heart reuse this for a smaller backing heart behind its cogs.
function makeHeartFillChunk(count: number, bias: HeroShapeConfig['reactTo'], scaleMul = 1): ParticleChunk {
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

    basePos[i * 3] = x * HEART_SCALE * scaleMul
    basePos[i * 3 + 1] = y * HEART_SCALE * scaleMul
    basePos[i * 3 + 2] = z * HEART_SCALE * scaleMul

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

  return { basePos, normal, seed, bandWeights, ringCenter: new Float32Array(count * 3), ringRadius: new Float32Array(count), ringAngle0: new Float32Array(count), ringSpin: new Float32Array(count), count }
}

function buildHeartParticleGeometry(bias: HeroShapeConfig['reactTo'], count = 2600) {
  const chunk = makeHeartFillChunk(count, bias)
  return assembleParticleGeometry(chunk.basePos, chunk.normal, chunk.seed, chunk.bandWeights, chunk.count)
}

// A gear's particles: a toothed rim band (radius bumps up on alternating
// "teeth" wedges around the circle) plus a uniform-by-area disk fill, all
// carrying the same aRingCenter/aRingSpin so the vertex shader spins the
// whole cog as one independently-rotating piece.
function makeGearChunk(
  count: number,
  bias: HeroShapeConfig['reactTo'],
  center: [number, number, number],
  baseRadius: number,
  teeth: number,
  toothDepth: number,
  spin: number
): ParticleChunk {
  const [cx, cy, cz] = center
  const basePos = new Float32Array(count * 3)
  const normal = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const bandWeights = new Float32Array(count * 3)
  const ringCenter = new Float32Array(count * 3)
  const ringRadius = new Float32Array(count)
  const ringAngle0 = new Float32Array(count)
  const ringSpin = new Float32Array(count)

  const rimCount = Math.floor(count * 0.45)

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    let radius: number
    if (i < rimCount) {
      const toothPhase = (angle * teeth) / (Math.PI * 2)
      const bump = toothPhase - Math.floor(toothPhase) < 0.5 ? toothDepth : -toothDepth * 0.4
      radius = baseRadius + bump + (Math.random() - 0.5) * baseRadius * 0.05
    } else {
      radius = baseRadius * 0.82 * Math.sqrt(Math.random())
    }

    ringCenter[i * 3] = cx
    ringCenter[i * 3 + 1] = cy
    ringCenter[i * 3 + 2] = cz
    ringRadius[i] = radius
    ringAngle0[i] = angle
    ringSpin[i] = spin

    basePos[i * 3] = cx + Math.cos(angle) * radius
    basePos[i * 3 + 1] = cy + Math.sin(angle) * radius
    basePos[i * 3 + 2] = cz

    normal[i * 3] = Math.cos(angle)
    normal[i * 3 + 1] = Math.sin(angle)
    normal[i * 3 + 2] = 0.35

    seed[i] = Math.random()
    const [wb, wm, wt] = randomBandWeights(bias)
    bandWeights[i * 3] = wb
    bandWeights[i * 3 + 1] = wm
    bandWeights[i * 3 + 2] = wt
  }

  return { basePos, normal, seed, bandWeights, ringCenter, ringRadius, ringAngle0, ringSpin, count }
}

function concatChunks(chunks: ParticleChunk[]) {
  const total = chunks.reduce((sum, c) => sum + c.count, 0)
  const basePos = new Float32Array(total * 3)
  const normal = new Float32Array(total * 3)
  const seed = new Float32Array(total)
  const bandWeights = new Float32Array(total * 3)
  const ringCenter = new Float32Array(total * 3)
  const ringRadius = new Float32Array(total)
  const ringAngle0 = new Float32Array(total)
  const ringSpin = new Float32Array(total)

  let offset = 0
  for (const c of chunks) {
    basePos.set(c.basePos, offset * 3)
    normal.set(c.normal, offset * 3)
    seed.set(c.seed, offset)
    bandWeights.set(c.bandWeights, offset * 3)
    ringCenter.set(c.ringCenter, offset * 3)
    ringRadius.set(c.ringRadius, offset)
    ringAngle0.set(c.ringAngle0, offset)
    ringSpin.set(c.ringSpin, offset)
    offset += c.count
  }

  return assembleParticleGeometry(basePos, normal, seed, bandWeights, total, {
    center: ringCenter,
    radius: ringRadius,
    angle0: ringAngle0,
    spin: ringSpin,
  })
}

// The "corazón mecánico": a filled heart backdrop with four gears embedded
// in its chest, each spinning at its own independent speed (alternating
// direction like meshing teeth would).
function buildGearHeartParticleGeometry(bias: HeroShapeConfig['reactTo']) {
  return concatChunks([
    makeHeartFillChunk(1700, bias, 0.9),
    makeGearChunk(700, bias, [-0.28, 0.4, 0.42], 0.42, 10, 0.05, 0.9),
    makeGearChunk(520, bias, [0.32, 0.46, 0.42], 0.32, 8, 0.045, -1.3),
    makeGearChunk(260, bias, [0.02, -0.05, 0.48], 0.22, 6, 0.035, 1.8),
    makeGearChunk(140, bias, [-0.34, -0.4, 0.46], 0.15, 6, 0.03, -2.2),
  ])
}

function smoothBand(current: number, target: number) {
  const attackRate = target > current ? 0.5 : 0.08
  return THREE.MathUtils.lerp(current, target, attackRate)
}

export function ParticleShape({ config, sourceGeometry }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { audioReactive } = useEditorStore()

  const particleGeometry = useMemo(() => {
    if (config.type === 'gearHeart') return buildGearHeartParticleGeometry(config.reactTo)
    if (config.type === 'heart') return buildHeartParticleGeometry(config.reactTo)
    return buildParticleGeometry(sourceGeometry, config.reactTo)
  }, [sourceGeometry, config.reactTo, config.type])
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
      uSpeakerPush: { value: 0 },
      uCameraRightLocal: { value: new THREE.Vector3(1, 0, 0) },
      uCameraUpLocal: { value: new THREE.Vector3(0, 1, 0) },
    }),
    [config.colorA, config.colorB]
  )

  const invRotation = useMemo(() => new THREE.Matrix3(), [])
  const rightWorld = useMemo(() => new THREE.Vector3(), [])
  const upWorld = useMemo(() => new THREE.Vector3(), [])
  const speakerSpring = useRef({ value: 0, velocity: 0 })

  useFrame(({ camera }, delta) => {
    if (matRef.current) {
      const u = matRef.current.uniforms
      u.uTime.value += delta
      u.uBass.value = smoothBand(u.uBass.value, audioReactive.bass)
      u.uMid.value = smoothBand(u.uMid.value, audioReactive.mid)
      u.uTreble.value = smoothBand(u.uTreble.value, audioReactive.treble)

      // Speaker-cone spring: chases the shape's own reactive band and
      // slightly overshoots on release, so the whole cloud physically
      // bounces out and back in on each hit instead of just fading. Clamp
      // the timestep — explicit Euler integration blows up (and locks the
      // spring into NaN forever) if a tab-switch or asset-load hitch hands
      // it an unusually large delta.
      const spring = speakerSpring.current
      const dt = Math.min(delta, 1 / 30)
      const target = audioReactive[config.reactTo]
      const accel = (target - spring.value) * 180 - spring.velocity * 12
      spring.velocity += accel * dt
      spring.value += spring.velocity * dt
      if (!Number.isFinite(spring.value)) {
        spring.value = 0
        spring.velocity = 0
      }
      u.uSpeakerPush.value = spring.value
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
