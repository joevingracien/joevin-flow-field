import { useRef, useMemo, useEffect } from 'react'
import { extend, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { SpriteNodeMaterial } from 'three/webgpu'
import { useTexture } from '@react-three/drei'
import {
  texture,
  attribute,
  vec2,
  vec3,
  float,
  Fn,
  instanceIndex,
  instancedArray,
  uniform,
  If,
  uint,
  uv,
} from 'three/tsl'

// Extend R3F with SpriteNodeMaterial
extend({ SpriteNodeMaterial })

/**
 * TSL-based GPGPU Particle System with WebGPU
 * Using Points geometry like the original
 */
export function ParticlesWebGPU() {
  const SIZE = 256
  const COUNT = SIZE * SIZE

  // Load photo texture
  const photoTexture = useTexture('/img/photospaceme.webp')

  const { viewport, size: viewportSize } = useThree()

  // Mouse tracking
  const mousePos = useRef(new THREE.Vector2(0, 0))

  // Create particle system with TSL compute shaders
  const particleSystem = useMemo(() => {
    console.log('Creating particle system with', COUNT, 'particles')

    // Storage buffers for GPGPU
    const positionBuffer = instancedArray(COUNT, 'vec3')
    const velocityBuffer = instancedArray(COUNT, 'vec3')
    const originalPosBuffer = instancedArray(COUNT, 'vec3')

    // Mouse position uniform
    const mouseUniform = uniform(vec3(0, 0, 0))

    // Get element at current instance
    const position = positionBuffer.element(instanceIndex)
    const velocity = velocityBuffer.element(instanceIndex)
    const originalPos = originalPosBuffer.element(instanceIndex)

    // Initialize particles in grid formation
    const computeInit = Fn(() => {
      const i = instanceIndex.div(uint(SIZE)).toFloat()
      const j = instanceIndex.mod(uint(SIZE)).toFloat()

      const x = i.div(SIZE - 1).mul(5).sub(2.5)
      const y = j.div(SIZE - 1).mul(5).sub(2.5)
      const z = float(0)

      position.assign(vec3(x, y, z))
      originalPos.assign(vec3(x, y, z))
      velocity.assign(vec3(0, 0, 0))
    })

    // Update particle physics
    const computeUpdate = Fn(() => {
      const pos = position
      const vel = velocity
      const original = originalPos

      // Damping
      vel.mulAssign(0.99)

      // Attraction to original position
      const toOriginal = original.sub(pos)
      const dist = toOriginal.length()

      If(dist.greaterThan(float(0.01)), () => {
        const direction = toOriginal.normalize()
        vel.addAssign(direction.mul(0.0001))
      })

      // Mouse repulsion
      const toMouse = pos.sub(mouseUniform)
      const mouseDist = toMouse.length()
      const maxDist = float(0.4)

      If(mouseDist.lessThan(maxDist), () => {
        const mouseDir = toMouse.normalize()
        const strength = float(1.0).sub(mouseDist.div(maxDist)).mul(0.01)
        vel.addAssign(mouseDir.mul(strength))
      })

      // Update position
      pos.addAssign(vel)
    })

    // Create compute nodes (don't run yet)
    console.log('Creating compute nodes...')
    const computeInitNode = computeInit().compute(COUNT)
    const computeUpdateNode = computeUpdate().compute(COUNT)

    // Create TSL nodes for sprite material
    const positionNode = positionBuffer.toAttribute()

    // Color from photo texture
    const uvX = instanceIndex.div(uint(SIZE)).toFloat().div(SIZE)
    const uvY = instanceIndex.mod(uint(SIZE)).toFloat().div(SIZE)
    const uvCoords = vec2(uvY, uvX)
    const colorNode = texture(photoTexture, uvCoords)

    // Scale/size node
    const scaleNode = float(0.01)

    console.log('Particle system created')

    return {
      computeInitNode,
      computeUpdateNode,
      mouseUniform,
      nodes: {
        positionNode,
        colorNode,
        scaleNode,
      },
      COUNT,
    }
  }, [COUNT, SIZE, photoTexture])

  // Initialize compute shader once
  const initialized = useRef(false)
  const { gl } = useThree()

  useEffect(() => {
    if (!initialized.current && gl && particleSystem.computeInitNode) {
      console.log('Running init compute shader...')
      // Cast to WebGPURenderer to access compute method
      const renderer = gl as any
      if (renderer.compute) {
        renderer.compute(particleSystem.computeInitNode)
        initialized.current = true
        console.log('Init compute complete!')
      }
    }
  }, [gl, particleSystem])

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / viewportSize.width) * 2 - 1
      mousePos.current.y = -(e.clientY / viewportSize.height) * 2 + 1
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mousePos.current.x = (e.touches[0].clientX / viewportSize.width) * 2 - 1
        mousePos.current.y = -(e.touches[0].clientY / viewportSize.height) * 2 + 1
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [viewportSize])

  // Update mouse uniform and run compute shader each frame
  useFrame(({ gl: renderer }) => {
    const mx = (mousePos.current.x * viewport.width) / 2
    const my = (mousePos.current.y * viewport.height) / 2
    particleSystem.mouseUniform.value.set(mx, my, 0)

    // Run compute shader using renderer.compute()
    const webgpuRenderer = renderer as any
    if (webgpuRenderer.compute && particleSystem.computeUpdateNode) {
      webgpuRenderer.compute(particleSystem.computeUpdateNode)
    }
  })

  // Render using sprite with count for instanced particles
  return (
    <sprite count={particleSystem.COUNT}>
      <spriteNodeMaterial
        {...particleSystem.nodes}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  )
}
