'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three/webgpu'
import {
  atan,
  sin,
  cos,
  storage,
  Fn,
  instanceIndex,
  hash,
  If,
  floor,
  uv,
  vec4,
  vec3,
  vec2,
  Loop,
  int,
  float,
  uniform,
  time,
  length,
  max,
  smoothstep,
  clamp,
  saturate,
} from 'three/tsl'
import { cosinePalette } from '@/lib/tsl'
import colorPalettes from 'nice-color-palettes'
import type { FlowFieldProps } from './FlowField.types'

/**
 * Converts hex color to RGB array [0-1]
 */
export const hexToRgbArray = (hex: string): number[] | null => {
  const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return rgb ? rgb.slice(1).map((n) => parseInt(n, 16) / 255) : null
}

/**
 * Generates a color palette for particles using nice-color-palettes
 * @param particlesCount - Number of particles to generate colors for
 * @returns Float32Array of RGB values
 */
const generateColorPalette = (particlesCount: number): Float32Array => {
  const allColors: number[] = []
  const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)]
  let paletteIndex = -1

  const BATCH_SIZE = 5000

  for (let i = 0; i < particlesCount; i += BATCH_SIZE) {
    paletteIndex = (paletteIndex + 1) % randomPalette.length

    const batchEnd = Math.min(i + BATCH_SIZE, particlesCount)
    const color = hexToRgbArray(randomPalette[paletteIndex])

    if (color) {
      for (let j = i; j < batchEnd; j++) {
        allColors.push(color[0], color[1], color[2])
      }
    }
  }

  return new Float32Array(allColors)
}

/**
 * FlowField - GPU-accelerated particle system with flow field simulation
 *
 * Uses WebGPU compute shaders for high-performance particle simulation.
 * Supports interactive mouse control and custom TSL shader functions.
 * Optimized by React Compiler - automatic memoization applied.
 */
export const FlowField = ({
  flowFieldFn,
  colorNodeFn,
  opacityNodeFn,
  rows = 1024,
  columns = 1024,
  depth = 1,
  particlesCount = Math.pow(2, 18),
  particleScale = 0.002,
  particleOpacity = 0.15,
  particleSpeed = 0.01,
  particleLifespan = 1,
  particleDecay = 0.001,
  randomise = false,
  flowFieldAngles = [1, 1, 0] as [number, number, number],
  updateFlowField = false,
  params = {},
  mousePosition = null,
  mouseEmitRatio = 0,
  mouseRepulsionRadius = 0,
  mouseRepulsionStrength = 0.03,
  mouseRepulsionSwirl = 0.4,
  mouseRepulsionSpreadFactor = 15,
}: FlowFieldProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const gl = useThree((state) => state.gl) as unknown as THREE.WebGPURenderer
  const { width, height } = useThree((state) => state.size)

  const FLOW_FIELD_SIZE = columns * rows * depth

  // Refs for WebGPU resources - initialized once
  const mouseUniformRef = useRef<ReturnType<typeof uniform<THREE.Vector2>> | null>(null)
  const flowFieldBufferRef = useRef<ReturnType<typeof storage> | null>(null)
  const computeUpdateRef = useRef<any>(null)
  const particlesMeshRef = useRef<THREE.InstancedMesh | null>(null)

  // Initialize WebGPU resources on first render
  if (!mouseUniformRef.current) {
    mouseUniformRef.current = uniform(new THREE.Vector2(0.5, 0.5))
  }
  if (!flowFieldBufferRef.current) {
    flowFieldBufferRef.current = storage(
      new THREE.StorageInstancedBufferAttribute(FLOW_FIELD_SIZE, 1),
      'float',
      FLOW_FIELD_SIZE,
    )
  }

  const mouseUniform = mouseUniformRef.current
  const flowFieldBuffer = flowFieldBufferRef.current

  // Initialize compute shaders and mesh on first render
  if (!particlesMeshRef.current) {
    const flowFieldInitFn = flowFieldFn({
      rows,
      columns,
      depth,
      flowFieldBuffer,
      params,
    }).compute(FLOW_FIELD_SIZE)
    gl.compute(flowFieldInitFn)

    const basePositionAttr = new THREE.StorageInstancedBufferAttribute(particlesCount, 4)
    const positionAttr = new THREE.StorageInstancedBufferAttribute(particlesCount, 4)
    const colorArray = colorNodeFn ? new Float32Array(particlesCount * 3) : generateColorPalette(particlesCount)
    const colorAttr = new THREE.StorageInstancedBufferAttribute(colorArray, 3)
    const scaleAttr = new THREE.StorageInstancedBufferAttribute(particlesCount, 1)
    const opacityAttr = new THREE.StorageInstancedBufferAttribute(particlesCount, 1)
    const speedAttr = new THREE.StorageInstancedBufferAttribute(particlesCount, 1)

    const velocityAttr = new THREE.StorageInstancedBufferAttribute(particlesCount, 1)

    const basePositionBuffer = storage(basePositionAttr, 'vec4', particlesCount)
    const positionBuffer = storage(positionAttr, 'vec4', particlesCount)
    const colorBuffer = storage(colorAttr, 'vec3', particlesCount)
    const scaleBuffer = storage(scaleAttr, 'float', particlesCount)
    const opacityBuffer = storage(opacityAttr, 'float', particlesCount)
    const speedBuffer = storage(speedAttr, 'float', particlesCount)
    const velocityBuffer = storage(velocityAttr, 'float', particlesCount)

    // Halton sequence for better particle distribution
    const halton = Fn(([index, base]: [any, any]) => {
      const result = float(0.0).toVar()
      const f = float(1.0).toVar()
      const i = float(index).toVar()

      Loop({ start: int(0), end: int(10), type: 'int', condition: '<' }, () => {
        const remainder = i.mod(base)
        f.assign(f.div(base))
        result.addAssign(f.mul(remainder))
        i.assign(floor(i.div(base)))
      })

      return result
    })

    // Compute init
    const particlesInitFn = Fn(() => {
      const basePosition = basePositionBuffer.element(instanceIndex)
      const position = positionBuffer.element(instanceIndex)

      const haltonX = halton(instanceIndex, float(2)).mul(2).sub(1)
      const haltonY = halton(instanceIndex, float(3)).mul(2).sub(1)
      const haltonZ = halton(instanceIndex, float(5)).mul(2).sub(1)

      const p = vec4(haltonX, haltonY, haltonZ, hash(instanceIndex.mul(3)).mul(particleLifespan))
      position.assign(p)
      basePosition.assign(p)

      const scale = scaleBuffer.element(instanceIndex)
      scale.assign(particleScale)

      const opacity = opacityBuffer.element(instanceIndex)
      opacity.assign(particleOpacity)

      // Per-particle speed variation: 50% to 150% of base speed
      // This creates a mix of fast and slow particles for organic feel
      const speedVariation = hash(instanceIndex.add(7777)).mul(1.0).add(0.5) // Range: 0.5 to 1.5
      const speed = speedBuffer.element(instanceIndex)
      speed.assign(float(particleSpeed).mul(speedVariation))
    })().compute(particlesCount)
    gl.compute(particlesInitFn)

    const xCellSize = 1 / columns
    const yCellSize = 1 / rows
    const zCellSize = 1 / depth

    // Compute update with per-particle noise for organic movement
    const particlesUpdate = Fn(() => {
      const updatePos = positionBuffer.element(instanceIndex).xyz
      const updateLifespan = positionBuffer.element(instanceIndex).w

      const particleAlive = updateLifespan.greaterThan(0)

      If(particleAlive, () => {
        const normalisedParticlePosition = updatePos.add(1).div(2)
        const indexX = floor(normalisedParticlePosition.x.div(xCellSize))
        const indexY = floor(normalisedParticlePosition.y.div(yCellSize))
        const indexZ = floor(normalisedParticlePosition.z.div(zCellSize))

        const flowFieldIndex = indexZ.mul(columns * rows).add(indexY.mul(columns)).add(indexX)
        const baseAngle = flowFieldBuffer.element(flowFieldIndex)

        // Per-particle unique offset using hash of instanceIndex
        // This ensures each particle has its own "personality"
        const particleHash1 = hash(instanceIndex)
        const particleHash2 = hash(instanceIndex.add(12345))

        // Time-varying noise offset unique to each particle
        // Creates organic wobble that's different for every particle
        const timeOffset = time.mul(2.0).add(particleHash1.mul(100.0))
        const noiseOffset = sin(timeOffset).mul(0.3).add(cos(timeOffset.mul(1.7)).mul(0.2))

        // Apply per-particle angle perturbation
        const angle = baseAngle.add(noiseOffset.mul(particleHash2.sub(0.5).mul(2.0)))

        // Dynamic speed modulation - each particle pulses at its own rhythm
        const speedPulse = sin(time.mul(1.5).add(particleHash1.mul(50.0))).mul(0.3).add(1.0) // Range: 0.7 to 1.3
        const baseSpeed = speedBuffer.element(instanceIndex)
        const speed = baseSpeed.mul(updateLifespan).mul(speedPulse)

        // Base movement from flow field
        const baseX = flowFieldAngles[0] > 0 ? cos(angle).mul(speed) : float(0)
        const baseY = flowFieldAngles[1] > 0 ? sin(angle).mul(speed) : float(0)
        const baseZ = flowFieldAngles[2] > 0 ? atan(angle).mul(speed) : float(0)

        // Add subtle brownian jitter (random walk) for organic feel
        // Uses time-based hash for pseudo-random per-frame variation
        const jitterStrength = speed.mul(0.15)
        const jitterX = hash(instanceIndex.add(floor(time.mul(60.0)))).sub(0.5).mul(jitterStrength)
        const jitterY = hash(instanceIndex.add(floor(time.mul(60.0)).add(999))).sub(0.5).mul(jitterStrength)

        // Mouse repulsion - organic flow around cursor
        const repulsionX = float(0).toVar()
        const repulsionY = float(0).toVar()

        If(float(mouseRepulsionRadius).greaterThan(0), () => {
          // Convert mouse position from (0-1) to particle space (-1 to 1)
          const mouseWorldX = mouseUniform.x.mul(2.0).sub(1.0)
          const mouseWorldY = mouseUniform.y.mul(2.0).sub(1.0)

          // Vector from mouse to particle
          const awayX = updatePos.x.sub(mouseWorldX)
          const awayY = updatePos.y.sub(mouseWorldY)
          const distToMouse = length(vec2(awayX, awayY))
          const normalizedDist = max(distToMouse, float(0.001))

          // Normalize away vector
          const dirX = awayX.div(normalizedDist)
          const dirY = awayY.div(normalizedDist)

          // SOFT POLYNOMIAL FALLOFF - much gentler than 1/distance
          // Uses cubic falloff: (1 - d/r)^3 for ultra-smooth gradient
          const normalizedRadius = distToMouse.div(float(mouseRepulsionRadius))
          const softFalloff = max(float(1.0).sub(normalizedRadius), float(0.0))
          const cubicFalloff = softFalloff.mul(softFalloff).mul(softFalloff) // cubic for extra smoothness

          // VELOCITY-BASED SPREAD - faster particles spread more
          // This creates dynamic scatter where high-velocity particles deflect more
          const particleVelocity = speed // already computed above
          const velocityMultiplier = float(1.0).add(particleVelocity.mul(mouseRepulsionSpreadFactor))

          // TANGENTIAL FLOW - particles swirl around cursor instead of just fleeing
          // Perpendicular vector for swirl effect (rotate 90 degrees)
          const tangentX = dirY.negate() // -y component
          const tangentY = dirX // x component

          // Mix radial (away) and tangential (around) based on swirlRatio
          // Higher swirl = more flowing around, lower = more direct push
          const swirlAmount = float(mouseRepulsionSwirl)
          const radialAmount = float(1.0).sub(swirlAmount)

          const flowDirX = dirX.mul(radialAmount).add(tangentX.mul(swirlAmount))
          const flowDirY = dirY.mul(radialAmount).add(tangentY.mul(swirlAmount))

          // ADD TURBULENCE - organic noise to the repulsion direction
          // Per-particle, time-varying noise for chaotic organic feel
          const turbulenceTime = time.mul(3.0).add(particleHash1.mul(50.0))
          const turbulenceNoise = sin(turbulenceTime).mul(cos(turbulenceTime.mul(1.3))).mul(0.4)

          // Apply turbulence as rotation of the flow direction
          const turbulenceAngle = turbulenceNoise.mul(0.5) // max ±0.2 radians
          const cosT = cos(turbulenceAngle)
          const sinT = sin(turbulenceAngle)
          const turbulentDirX = flowDirX.mul(cosT).sub(flowDirY.mul(sinT))
          const turbulentDirY = flowDirX.mul(sinT).add(flowDirY.mul(cosT))

          // FINAL FORCE - combine all factors
          // cubicFalloff provides soft gradient, velocityMultiplier adds spread dynamics
          const pushStrength = cubicFalloff.mul(mouseRepulsionStrength).mul(velocityMultiplier)

          repulsionX.assign(turbulentDirX.mul(pushStrength))
          repulsionY.assign(turbulentDirY.mul(pushStrength))
        })

        // Track velocity for dynamic coloring
        const deltaX = baseX.add(jitterX).add(repulsionX)
        const deltaY = baseY.add(jitterY).add(repulsionY)
        const velocityMag = length(vec2(deltaX, deltaY))
        velocityBuffer.element(instanceIndex).assign(velocityMag)

        updatePos.addAssign(vec3(deltaX, deltaY, baseZ))
        updateLifespan.subAssign(particleDecay)

        if (colorNodeFn) {
          const updateColor = colorBuffer.element(instanceIndex)
          updateColor.assign(colorNodeFn(angle, speed))
        }
      }).Else(() => {
        const basePosition = basePositionBuffer.element(instanceIndex)

        // Determine if this particle should spawn from mouse or base position
        // Use a time-varying hash so different particles spawn from mouse over time
        const spawnHash = hash(instanceIndex.add(floor(time.mul(10.0))))
        const spawnFromMouse = spawnHash.lessThan(mouseEmitRatio)

        If(spawnFromMouse, () => {
          // Convert mouse position from (0-1) to particle space (-1 to 1)
          const mouseX = mouseUniform.x.mul(2.0).sub(1.0)
          const mouseY = mouseUniform.y.mul(2.0).sub(1.0)

          // Add scatter/spread around mouse for organic trail effect
          const scatterX = hash(instanceIndex.add(floor(time.mul(60.0)))).sub(0.5).mul(0.15)
          const scatterY = hash(instanceIndex.add(floor(time.mul(60.0)).add(777))).sub(0.5).mul(0.15)

          updatePos.assign(vec3(mouseX.add(scatterX), mouseY.add(scatterY), float(0)))
          // Shorter lifespan for mouse-spawned particles (trail fades faster)
          updateLifespan.assign(hash(instanceIndex.mul(7)).mul(particleLifespan).mul(0.6))
        }).Else(() => {
          updatePos.assign(basePosition.xyz)
          updateLifespan.assign(basePosition.w)
        })
      })
    })().compute(particlesCount)

    const material = new THREE.SpriteNodeMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })

    material.positionNode = positionBuffer.toAttribute()
    material.scaleNode = scaleBuffer.toAttribute()

    // Dynamic Aurora color system
    material.colorNode = colorNodeFn
      ? colorBuffer.toAttribute()
      : Fn(() => {
          const velocity = velocityBuffer.toAttribute()
          const position = positionBuffer.toAttribute()

          // Velocity factor - faster = hotter
          const normalizedVel = clamp(velocity.div(float(particleSpeed).mul(2.0)), float(0), float(1))

          // Mouse proximity
          const mouseWorldX = mouseUniform.x.mul(2.0).sub(1.0)
          const mouseWorldY = mouseUniform.y.mul(2.0).sub(1.0)
          const distToMouse = length(vec2(position.x.sub(mouseWorldX), position.y.sub(mouseWorldY)))
          const mouseHeat = smoothstep(float(0.25), float(0.0), distToMouse)

          // Lava colors - darker, more saturated
          const darkRed = vec3(0.4, 0.05, 0.02)   // Deep ember
          const brightOrange = vec3(0.9, 0.25, 0.05) // Hot orange
          const hotYellow = vec3(1.0, 0.5, 0.1)   // Molten orange-yellow

          // Blend based on velocity + mouse heat
          const heat = clamp(normalizedVel.add(mouseHeat.mul(0.5)), float(0), float(1))

          // Two-stage blend: red -> orange -> yellow
          const midPoint = float(0.5)
          const lowBlend = smoothstep(float(0), midPoint, heat)
          const highBlend = smoothstep(midPoint, float(1), heat)

          // Mix colors
          const color1 = darkRed.mul(float(1).sub(lowBlend)).add(brightOrange.mul(lowBlend))
          const finalColor = color1.mul(float(1).sub(highBlend)).add(hotYellow.mul(highBlend))

          return finalColor
        })()

    material.opacityNode = opacityNodeFn
      ? opacityNodeFn(opacityBuffer)
      : Fn(() => {
          // Soft circle - subtle gradient edge instead of hard cutoff
          const dist = length(uv().sub(vec2(0.5, 0.5)))
          const circle = smoothstep(float(0.5), float(0.3), dist)
          return circle.mul(opacityBuffer.toAttribute())
        })()

    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, particlesCount)
    mesh.frustumCulled = false

    computeUpdateRef.current = particlesUpdate
    particlesMeshRef.current = mesh
  }

  const computeUpdate = computeUpdateRef.current
  const mesh = particlesMeshRef.current!

  // Randomize flow field periodically if enabled
  useEffect(() => {
    if (!randomise) {
      return
    }

    const intervalId = setInterval(async () => {
      const flowFieldUpdate = flowFieldFn({
        rows,
        columns,
        depth,
        flowFieldBuffer,
        params,
      }).compute(FLOW_FIELD_SIZE)
      await gl.computeAsync(flowFieldUpdate)
    }, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [randomise, flowFieldFn, rows, columns, depth, flowFieldBuffer, params, FLOW_FIELD_SIZE, gl])

  // React Compiler will memoize these computations
  const flowFieldUpdateParams = mousePosition ? { ...params, attractorPos: mouseUniform } : params
  const flowFieldUpdateCompute = updateFlowField
    ? flowFieldFn({
        rows,
        columns,
        depth,
        flowFieldBuffer,
        params: flowFieldUpdateParams,
      }).compute(FLOW_FIELD_SIZE)
    : null

  useFrame(async ({ gl: renderer }) => {
    const gpuRenderer = renderer as unknown as THREE.WebGPURenderer
    // Update mouse uniform value if mousePosition is provided
    if (mousePosition) {
      mouseUniform.value.set(mousePosition.current.x, mousePosition.current.y)
    }

    await gpuRenderer.computeAsync(computeUpdate)

    if (updateFlowField && flowFieldUpdateCompute) {
      await gpuRenderer.computeAsync(flowFieldUpdateCompute)
    }
  })

  return <primitive object={mesh} scale={[width * 0.5, height * 0.5, 1]} ref={meshRef} />
}
