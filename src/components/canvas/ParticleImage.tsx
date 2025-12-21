'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three/webgpu'
import {
  storage,
  Fn,
  instanceIndex,
  If,
  floor,
  uv,
  vec4,
  vec2,
  float,
  uniform,
  length,
  max,
  smoothstep,
  hash,
  time,
} from 'three/tsl'

export interface ParticleImageProps {
  /** Image URL or path */
  imageSrc: string
  /** Number of particles (will be squared, e.g., 256 = 256x256 grid) */
  resolution?: number
  /** Base particle size */
  particleScale?: number
  /** Base particle opacity */
  particleOpacity?: number
  /** Mouse position ref (0-1 normalized) */
  mousePosition?: React.RefObject<{ x: number; y: number }>
  /** Mouse repulsion radius (0-1) */
  mouseRepulsionRadius?: number
  /** Mouse repulsion strength */
  mouseRepulsionStrength?: number
  /** How fast particles return to home position */
  returnSpeed?: number
}

export const ParticleImage = ({
  imageSrc,
  resolution = 200,
  particleScale = 0.004,
  particleOpacity = 0.9,
  mousePosition = null,
  mouseRepulsionRadius = 0.15,
  mouseRepulsionStrength = 0.08,
  returnSpeed = 0.05,
}: ParticleImageProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const gl = useThree((state) => state.gl) as unknown as THREE.WebGPURenderer
  const { width, height } = useThree((state) => state.size)

  const particlesCount = resolution * resolution

  // State to trigger re-render when mesh is ready
  const [mesh, setMesh] = useState<THREE.InstancedMesh | null>(null)

  // Refs for WebGPU resources
  const mouseUniformRef = useRef<ReturnType<typeof uniform<THREE.Vector2>> | null>(null)
  const computeUpdateRef = useRef<any>(null)
  const textureLoadedRef = useRef(false)

  // Initialize uniforms
  if (!mouseUniformRef.current) {
    mouseUniformRef.current = uniform(new THREE.Vector2(0.5, 0.5))
  }

  const mouseUniform = mouseUniformRef.current

  // Load texture and initialize particles
  useEffect(() => {
    if (textureLoadedRef.current) return

    // Load image and sample pixels on CPU
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      console.log('Image loaded:', imageSrc, img.width, 'x', img.height)

      // Draw to canvas to get pixel data
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const pixels = imageData.data

      const imgWidth = img.width
      const imgHeight = img.height
      const aspect = imgWidth / imgHeight

      // Pre-compute all particle data on CPU
      const homePositions = new Float32Array(particlesCount * 2)
      const currentPositions = new Float32Array(particlesCount * 2)
      const colors = new Float32Array(particlesCount * 4)
      const scales = new Float32Array(particlesCount)

      // Spacing between particles
      const spacing = 2 / resolution

      for (let i = 0; i < particlesCount; i++) {
        const gridX = i % resolution
        const gridY = Math.floor(i / resolution)

        // UV coordinates (0 to 1)
        const uvX = gridX / (resolution - 1)
        const uvY = gridY / (resolution - 1)

        // Add slight random jitter to break up the grid
        const jitterX = (Math.random() - 0.5) * spacing * 0.3
        const jitterY = (Math.random() - 0.5) * spacing * 0.3

        // Position in clip space (-1 to 1)
        const posX = (uvX * 2 - 1) * aspect + jitterX
        const posY = -(uvY * 2 - 1) + jitterY // Flip Y

        homePositions[i * 2] = posX
        homePositions[i * 2 + 1] = posY
        currentPositions[i * 2] = posX
        currentPositions[i * 2 + 1] = posY

        // Sample pixel from image
        const pixelX = Math.floor(uvX * (imgWidth - 1))
        const pixelY = Math.floor(uvY * (imgHeight - 1))
        const pixelIndex = (pixelY * imgWidth + pixelX) * 4

        const r = pixels[pixelIndex] / 255
        const g = pixels[pixelIndex + 1] / 255
        const b = pixels[pixelIndex + 2] / 255
        const a = pixels[pixelIndex + 3] / 255

        colors[i * 4] = r
        colors[i * 4 + 1] = g
        colors[i * 4 + 2] = b
        colors[i * 4 + 3] = a

        // Scale based on brightness - smaller particles
        const brightness = r * 0.299 + g * 0.587 + b * 0.114
        scales[i] = particleScale * (0.5 + brightness * 0.5)
      }

      // Create storage buffers with pre-computed data
      const homePositionAttr = new THREE.StorageInstancedBufferAttribute(homePositions, 2)
      const currentPositionAttr = new THREE.StorageInstancedBufferAttribute(currentPositions, 2)
      const velocityAttr = new THREE.StorageInstancedBufferAttribute(new Float32Array(particlesCount * 2), 2)
      const colorAttr = new THREE.StorageInstancedBufferAttribute(colors, 4)
      const scaleAttr = new THREE.StorageInstancedBufferAttribute(scales, 1)

      const homePositionBuffer = storage(homePositionAttr, 'vec2', particlesCount)
      const currentPositionBuffer = storage(currentPositionAttr, 'vec2', particlesCount)
      const velocityBuffer = storage(velocityAttr, 'vec2', particlesCount)
      const colorBuffer = storage(colorAttr, 'vec4', particlesCount)
      const scaleBuffer = storage(scaleAttr, 'float', particlesCount)

      // Physics-based update (like the original WebGL version)
      const particlesUpdate = Fn(() => {
        const homePos = homePositionBuffer.element(instanceIndex)
        const currentPos = currentPositionBuffer.element(instanceIndex)
        const velocity = velocityBuffer.element(instanceIndex)

        // Read current values into mutable variables
        const posX = float(currentPos.x).toVar()
        const posY = float(currentPos.y).toVar()
        const velX = float(velocity.x).toVar()
        const velY = float(velocity.y).toVar()

        // Apply velocity damping (friction)
        velX.mulAssign(0.95)
        velY.mulAssign(0.95)

        // Spring force: attract back to original position
        const toHomeX = homePos.x.sub(posX)
        const toHomeY = homePos.y.sub(posY)
        const homeDist = length(vec2(toHomeX, toHomeY))

        If(homeDist.greaterThan(0.001), () => {
          const homeDir = vec2(toHomeX, toHomeY).normalize()
          velX.addAssign(homeDir.x.mul(0.0005))
          velY.addAssign(homeDir.y.mul(0.0005))
        })

        // Mouse repulsion force
        const mouseWorldX = mouseUniform.x.mul(2.0).sub(1.0).mul(float(aspect))
        const mouseWorldY = mouseUniform.y.mul(2.0).sub(1.0)

        const toMouseX = posX.sub(mouseWorldX)
        const toMouseY = posY.sub(mouseWorldY)
        const mouseDist = length(vec2(toMouseX, toMouseY))
        const maxDist = float(mouseRepulsionRadius)

        If(mouseDist.lessThan(maxDist), () => {
          const awayDir = vec2(toMouseX, toMouseY).normalize()
          const force = float(1.0).sub(mouseDist.div(maxDist)).mul(mouseRepulsionStrength)
          velX.addAssign(awayDir.x.mul(force))
          velY.addAssign(awayDir.y.mul(force))
        })

        // Apply velocity to position
        posX.addAssign(velX)
        posY.addAssign(velY)

        // Write back
        currentPos.x.assign(posX)
        currentPos.y.assign(posY)
        velocity.x.assign(velX)
        velocity.y.assign(velY)
      })().compute(particlesCount)

      // Create material - additive blending for glowing particles
      const material = new THREE.SpriteNodeMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      })

      material.positionNode = Fn(() => {
        const pos = currentPositionBuffer.toAttribute()
        return vec4(pos.x, pos.y, float(0), float(1))
      })()

      material.scaleNode = scaleBuffer.toAttribute()
      material.colorNode = Fn(() => {
        return colorBuffer.toAttribute().xyz
      })()

      material.opacityNode = Fn(() => {
        const dist = length(uv().sub(vec2(0.5, 0.5)))
        const circle = smoothstep(float(0.5), float(0.2), dist)
        const alpha = colorBuffer.toAttribute().w
        return circle.mul(alpha).mul(particleOpacity)
      })()

      const newMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, particlesCount)
      newMesh.frustumCulled = false

      computeUpdateRef.current = particlesUpdate
      textureLoadedRef.current = true
      setMesh(newMesh)
      console.log('Particle mesh created with', particlesCount, 'particles')
    }

    img.onerror = (error) => {
      console.error('Failed to load image:', imageSrc, error)
    }

    img.src = imageSrc
  }, [imageSrc, gl, particlesCount, resolution, particleScale, particleOpacity, mouseRepulsionRadius, mouseRepulsionStrength, returnSpeed, mouseUniform])

  useFrame(async ({ gl: renderer }) => {
    if (!computeUpdateRef.current || !mesh) return

    const gpuRenderer = renderer as unknown as THREE.WebGPURenderer

    if (mousePosition) {
      const mx = mousePosition.current.x
      const my = mousePosition.current.y
      mouseUniform.value.set(mx, my)
    }

    await gpuRenderer.computeAsync(computeUpdateRef.current)
  })

  if (!mesh) {
    return null
  }

  // Scale to fill viewport while maintaining aspect
  const scale = Math.min(width, height) * 0.45
  return <primitive object={mesh} scale={[scale, scale, 1]} ref={meshRef} />
}
