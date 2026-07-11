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
// vertices, each pushed outward along its normal by the audio level —
// the same silhouette as the solid mesh, but as a glowing particle cloud.
const PARTICLE_VERTEX_SHADER = /* glsl */ `
  attribute vec3 aBasePos;
  attribute vec3 aNormal;
  attribute float aSeed;

  uniform float uPointSize;
  uniform float uReact;
  uniform vec3 uCameraRightLocal;
  uniform vec3 uCameraUpLocal;

  varying vec2 vUv;
  varying float vSeed;

  void main() {
    float pulse = uReact * (0.1 + aSeed * 0.3);
    vec3 pos = aBasePos + aNormal * pulse;

    float sizeVar = 0.55 + aSeed * 0.75;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float depthScale = 1.0 / max(0.5, -mv.z);
    float worldSize = uPointSize * sizeVar * depthScale * (0.018 + uReact * 0.012);

    vec3 offset = (uCameraRightLocal * position.x + uCameraUpLocal * position.y) * worldSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + offset, 1.0);

    vUv = uv;
    vSeed = aSeed;
  }
`

const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uReact;
  varying vec2 vUv;
  varying float vSeed;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float d = length(p);
    float alpha = 1.0 - smoothstep(0.7, 1.0, d);
    if (alpha <= 0.02) discard;

    float core = 1.0 - smoothstep(0.0, 0.6, d);
    vec3 base = mix(uColorA, uColorB, vSeed);
    vec3 color = base * (0.65 + uReact * 0.8) + vec3(1.0) * core * (0.25 + uReact * 0.45);

    gl_FragColor = vec4(color, alpha);
  }
`

function buildParticleGeometry(source: THREE.BufferGeometry, maxCount = 2200) {
  const srcPos = source.attributes.position as THREE.BufferAttribute
  if (!source.attributes.normal) source.computeVertexNormals()
  const srcNormal = source.attributes.normal as THREE.BufferAttribute

  const total = srcPos.count
  const stride = Math.max(1, Math.floor(total / maxCount))
  const count = Math.floor(total / stride)

  const basePos = new Float32Array(count * 3)
  const normal = new Float32Array(count * 3)
  const seed = new Float32Array(count)

  for (let i = 0, si = 0; i < count; i++, si += stride) {
    basePos[i * 3] = srcPos.getX(si)
    basePos[i * 3 + 1] = srcPos.getY(si)
    basePos[i * 3 + 2] = srcPos.getZ(si)
    normal[i * 3] = srcNormal.getX(si)
    normal[i * 3 + 1] = srcNormal.getY(si)
    normal[i * 3 + 2] = srcNormal.getZ(si)
    seed[i] = Math.random()
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
  geometry.instanceCount = count
  geometry.boundingSphere = null
  geometry.boundingBox = null

  return geometry
}

export function ParticleShape({ config, sourceGeometry }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { audioReactive } = useEditorStore()

  const particleGeometry = useMemo(() => buildParticleGeometry(sourceGeometry), [sourceGeometry])
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
      uReact: { value: 0 },
      uCameraRightLocal: { value: new THREE.Vector3(1, 0, 0) },
      uCameraUpLocal: { value: new THREE.Vector3(0, 1, 0) },
    }),
    [config.colorA, config.colorB]
  )

  const invRotation = useMemo(() => new THREE.Matrix3(), [])
  const rightWorld = useMemo(() => new THREE.Vector3(), [])
  const upWorld = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }) => {
    const reactValue = audioReactive[config.reactTo]

    if (matRef.current) {
      const current = matRef.current.uniforms.uReact.value
      const attackRate = reactValue > current ? 0.5 : 0.08
      matRef.current.uniforms.uReact.value = THREE.MathUtils.lerp(current, reactValue, attackRate)
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
