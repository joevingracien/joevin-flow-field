import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'

export function Particles() {
  const SIZE = 512
  const PARTICLE_SIZE = 1.5
  const SYSTEM_SCALE = 1.2
  const photoTexture = useLoader(TextureLoader, '/img/photospaceme.webp', (loader) => {
    loader.minFilter = THREE.NearestFilter
    loader.magFilter = THREE.NearestFilter
  })

  const particles = useMemo(() => {
    const temp = new Float32Array(SIZE * SIZE * 3)
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        const k = i * SIZE + j
        temp[k * 3 + 0] = (i / (SIZE - 1)) * 5 - 2.5
        temp[k * 3 + 1] = (j / (SIZE - 1)) * 5 - 2.5
        temp[k * 3 + 2] = 0
      }
    }
    return temp
  }, [SIZE])

  const ref = useMemo(() => {
    const temp = new Float32Array(SIZE * SIZE * 2)
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        const k = i * SIZE + j
        temp[k * 2 + 0] = i / (SIZE - 1)
        temp[k * 2 + 1] = j / (SIZE - 1)
      }
    }
    return temp
  }, [SIZE])

  const renderMat = useRef()
  const followMouse = useRef()

  const { viewport, size, gl, camera } = useThree()

  const gpuCompute = useRef()
  const positionVariable = useRef()
  const mouse = useRef(new THREE.Vector2(0, 0))
  const time = useRef(0)

  useEffect(() => {
    gpuCompute.current = new GPUComputationRenderer(SIZE, SIZE, gl)

    const positionTexture = gpuCompute.current.createTexture()
    const positionArray = positionTexture.image.data
    for (let i = 0; i < positionArray.length; i += 4) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 0.1
      positionArray[i] = Math.cos(angle) * radius // Initial x in star shape
      positionArray[i + 1] = Math.sin(angle) * radius // Initial y in star shape
      positionArray[i + 2] = 0
      positionArray[i + 3] = Math.random() // Random phase for animation
    }

    const originalPositionTexture = gpuCompute.current.createTexture()
    const originalPositionArray = originalPositionTexture.image.data
    for (let i = 0; i < originalPositionArray.length; i += 4) {
      originalPositionArray[i] = particles[(i * 3) / 4]
      originalPositionArray[i + 1] = particles[(i * 3) / 4 + 1]
      originalPositionArray[i + 2] = particles[(i * 3) / 4 + 2]
      originalPositionArray[i + 3] = 1
    }

    positionVariable.current = gpuCompute.current.addVariable('texturePosition', positionShader, positionTexture)
    gpuCompute.current.setVariableDependencies(positionVariable.current, [positionVariable.current])

    positionVariable.current.material.uniforms.uMouse = { value: new THREE.Vector2() }
    positionVariable.current.material.uniforms.uOriginalPosition = { value: originalPositionTexture }
    positionVariable.current.material.uniforms.uSystemScale = { value: SYSTEM_SCALE }
    positionVariable.current.material.uniforms.uTime = { value: 0 }

    const error = gpuCompute.current.init()
    if (error !== null) {
      console.error(error)
    }
  }, [SIZE, particles, gl])

  useEffect(() => {
    const handleMouseMove = (event) => {
      mouse.current.x = (event.clientX / size.width) * 2 - 1
      mouse.current.y = -(event.clientY / size.height) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [size])

  useFrame(() => {
    time.current += 0.016

    if (gpuCompute.current && renderMat.current) {
      const vector = new THREE.Vector3(mouse.current.x, mouse.current.y, 0)
      vector.unproject(camera)
      const dir = vector.sub(camera.position).normalize()
      const distance = -camera.position.z / dir.z
      const pos = camera.position.clone().add(dir.multiplyScalar(distance))
      const mouseX = pos.x
      const mouseY = pos.y

      positionVariable.current.material.uniforms.uMouse.value.set(mouseX, mouseY)
      positionVariable.current.material.uniforms.uTime.value = time.current

      gpuCompute.current.compute()
      renderMat.current.uniforms.uPosition.value = gpuCompute.current.getCurrentRenderTarget(
        positionVariable.current,
      ).texture
      renderMat.current.uniforms.uTime.value = time.current
    }

    if (followMouse.current) {
      const vector = new THREE.Vector3(mouse.current.x, mouse.current.y, 0)
      vector.unproject(camera)
      const dir = vector.sub(camera.position).normalize()
      const distance = -camera.position.z / dir.z
      const pos = camera.position.clone().add(dir.multiplyScalar(distance))
      followMouse.current.position.x = pos.x
      followMouse.current.position.y = pos.y
    }
  })

  return (
    <>
      <mesh ref={followMouse} position={[-2, 1.5, 0]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <points scale={[SYSTEM_SCALE, SYSTEM_SCALE, SYSTEM_SCALE]}>
        <bufferGeometry>
          <bufferAttribute attach='attributes-position' count={particles.length / 3} array={particles} itemSize={3} />
          <bufferAttribute attach='attributes-ref' count={ref.length / 2} array={ref} itemSize={2} />
        </bufferGeometry>
        <shaderMaterial
          ref={renderMat}
          transparent
          blending={THREE.AdditiveBlending}
          uniforms={{
            uPosition: { value: null },
            uTexture: { value: photoTexture },
            uPointSize: { value: PARTICLE_SIZE },
            uTime: { value: 0 },
          }}
          vertexShader={`
            attribute vec2 ref;
            varying vec2 vRef;
            uniform sampler2D uPosition;
            uniform float uPointSize;
            uniform float uTime;
            void main() {
              vRef = ref;
              vec4 pos = texture2D(uPosition, ref);
              vec3 position = pos.xyz;
              float phase = pos.w;
              float visibility = smoothstep(0.0, 2.0, uTime - phase * 2.0);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = uPointSize * visibility;
            }
          `}
          fragmentShader={`
            varying vec2 vRef;
            uniform sampler2D uTexture;
            void main() {
              vec2 uv = vec2(vRef.y, vRef.x);
              vec4 textureColor = texture2D(uTexture, uv);
              gl_FragColor = textureColor;
            }
          `}
        />
      </points>
    </>
  )
}

const positionShader = `
  uniform vec2 uMouse;
  uniform sampler2D uOriginalPosition;
  uniform float uSystemScale;
  uniform float uTime;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 position = texture2D(texturePosition, uv);
    vec4 originalPosition = texture2D(uOriginalPosition, uv);
    vec2 velocity = position.zw;

    float phase = position.w;

    // Star to explosion
    float explosionStart = 2.0;
    float explosionDuration = 2.0;
    float t = clamp((uTime - explosionStart) / explosionDuration, 0.0, 1.0);
    vec2 explosionDir = normalize(position.xy);
    vec2 explosionPos = explosionDir * (0.1 + t * 5.0);

    // Explosion to original position
    float settleStart = explosionStart + explosionDuration;
    float settleDuration = 3.0;
    float s = clamp((uTime - settleStart) / settleDuration, 0.0, 1.0);
    s = smoothstep(0.0, 1.0, s);

    vec2 targetPosition = mix(explosionPos, originalPosition.xy, s);

    // Particle attraction to target position
    vec2 direction = normalize(targetPosition - position.xy);
    float dist = length(targetPosition - position.xy);

    velocity *= 0.98;

    if (dist > 0.01) {
      velocity += direction * 0.0005;
    }

    // Enhanced Mouse repel force
    float mouseDistance = distance(position.xy, uMouse / uSystemScale);
    float maxDistance = 0.5; // Reduced from 0.6 (or whatever value it was) to 0.3
    if (mouseDistance < maxDistance) {
      vec2 repelDirection = normalize(position.xy - uMouse / uSystemScale);
      float repelStrength = (1.0 - mouseDistance / maxDistance) * 0.05; // Adjusted from 0.03 to 0.02
      velocity += repelDirection * repelStrength;
    }

    position.xy += velocity * 0.5;

    gl_FragColor = vec4(position.xy, velocity);
  }
`
