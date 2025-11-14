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

// TypeScript declarations for extended components
declare module '@react-three/fiber' {
  interface ThreeElements {
    spriteNodeMaterial: any
  }
}

/**
 * TSL-based GPGPU Particle System with WebGPU
 * Using Points geometry like the original
 */
export function ParticlesWebGPU() {
  const SIZE = 256
  const COUNT = SIZE * SIZE

  // Load photo texture
  const photoTexture = useTexture('/img/photospaceme.webp')
  const photoTextureRef = useRef(photoTexture)
  photoTextureRef.current = photoTexture

  const state = useThree()

  // Store in refs to avoid triggering re-renders
  const viewportRef = useRef(state.viewport)
  const sizeRef = useRef(state.size)
  viewportRef.current = state.viewport
  sizeRef.current = state.size

  // Mouse tracking
  const mousePos = useRef(new THREE.Vector2(9999, 9999))

  // Create everything in refs to ensure it only happens once
  const systemRef = useRef<any>(null)
  const isCreatingRef = useRef(false)

  if (!systemRef.current && !isCreatingRef.current && photoTexture) {
    isCreatingRef.current = true
    const tex = photoTexture

    // Storage buffers for GPGPU
    const positionBuffer = instancedArray(COUNT, 'vec3')
    const velocityBuffer = instancedArray(COUNT, 'vec3')
    const originalPosBuffer = instancedArray(COUNT, 'vec3')

    // Mouse uniform - created once
    const mouseUniform = uniform(vec2(9999, 9999))

    // Get element at current instance
    const position = positionBuffer.element(instanceIndex)
    const velocity = velocityBuffer.element(instanceIndex)
    const originalPos = originalPosBuffer.element(instanceIndex)

    // Initialize particles in grid formation
    const computeInit = Fn(() => {
      const i = instanceIndex.div(uint(SIZE)).toFloat()
      const j = instanceIndex.mod(uint(SIZE)).toFloat()

      // Map to -2 to 2 range
      const x = i.div(SIZE - 1).mul(4).sub(2)
      const y = j.div(SIZE - 1).mul(4).sub(2)
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

      // Apply damping
      vel.mulAssign(0.9)

      // Attraction to original position - spring force
      const toOriginal = original.sub(pos)
      const distToOriginal = toOriginal.length()

      If(distToOriginal.greaterThan(0.001), () => {
        const force = toOriginal.mul(0.01) // Spring constant
        vel.addAssign(force)
      })

      // Mouse repulsion
      const dx = pos.x.sub(mouseUniform.x)
      const dy = pos.y.sub(mouseUniform.y)
      const distSq = dx.mul(dx).add(dy.mul(dy))
      const dist = distSq.sqrt()

      const interactionRadius = float(1.2)

      If(dist.lessThan(interactionRadius), () => {
        const force = interactionRadius.sub(dist).div(interactionRadius)
        const strength = force.mul(force).mul(0.3)

        If(dist.greaterThan(0.01), () => {
          vel.x.addAssign(dx.div(dist).mul(strength))
          vel.y.addAssign(dy.div(dist).mul(strength))
        })
      })

      // Update position
      pos.addAssign(vel)
    })

    // Create compute nodes (don't run yet)
    const computeInitNode = computeInit().compute(COUNT)
    const computeUpdateNode = computeUpdate().compute(COUNT)

    // Create TSL nodes for sprite material
    const positionNode = positionBuffer.toAttribute()

    // Color from photo texture
    const uvX = instanceIndex.div(uint(SIZE)).toFloat().div(SIZE)
    const uvY = instanceIndex.mod(uint(SIZE)).toFloat().div(SIZE)
    const uvCoords = vec2(uvX, uvY)
    const colorNode = texture(tex, uvCoords)

    // Scale/size node
    const scaleNode = float(0.01)

    systemRef.current = {
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
  }

  const particleSystem = systemRef.current

  // Initialize compute shader once
  const initialized = useRef(false)
  const glRef = useRef<any>(null)
  glRef.current = state.gl

  useEffect(() => {
    if (!initialized.current && glRef.current && particleSystem?.computeInitNode) {
      // Cast to WebGPURenderer to access compute method
      const renderer = glRef.current as any
      if (renderer.computeAsync) {
        renderer.computeAsync(particleSystem.computeInitNode)
        initialized.current = true
      }
    }
  }, [])

  // Mouse event handlers - convert to world space - ONLY SET UP ONCE
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Convert screen coordinates to normalized device coordinates
      const sz = sizeRef.current
      const x = (e.clientX / sz.width) * 2 - 1
      const y = -(e.clientY / sz.height) * 2 + 1

      // Convert to world space matching particle grid (-2 to 2)
      const vp = viewportRef.current
      mousePos.current.x = x * 2 * (vp.width / vp.height)
      mousePos.current.y = y * 2
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        const sz = sizeRef.current
        const x = (e.touches[0].clientX / sz.width) * 2 - 1
        const y = -(e.touches[0].clientY / sz.height) * 2 + 1

        const vp = viewportRef.current
        mousePos.current.x = x * 2 * (vp.width / vp.height)
        mousePos.current.y = y * 2
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  // Update mouse uniform and run compute shader each frame
  useFrame(() => {
    if (!particleSystem) return

    // Update the mouse uniform
    if (particleSystem.mouseUniform) {
      particleSystem.mouseUniform.value.set(mousePos.current.x, mousePos.current.y)
    }

    // Run compute shader
    if (glRef.current && particleSystem.computeUpdateNode) {
      const renderer = glRef.current as any
      if (renderer.computeAsync) {
        renderer.computeAsync(particleSystem.computeUpdateNode)
      } else if (renderer.compute) {
        renderer.compute(particleSystem.computeUpdateNode)
      }
    }
  })

  // Render using sprite with count for instanced particles
  if (!particleSystem) {
    return null
  }

  return (
    <sprite count={particleSystem.COUNT}>
      {/* @ts-ignore */}
      <spriteNodeMaterial
        positionNode={particleSystem.nodes.positionNode}
        colorNode={particleSystem.nodes.colorNode}
        scaleNode={particleSystem.nodes.scaleNode}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  )
}
