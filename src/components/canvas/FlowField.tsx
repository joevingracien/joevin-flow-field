'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three/webgpu'
import {
  select,
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
  mul,
  Loop,
  int,
  float,
  uniform,
} from 'three/tsl'
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
}: FlowFieldProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const gl = useThree((state) => state.gl)
  const { width, height } = useThree((state) => state.size)

  const FLOW_FIELD_SIZE = columns * rows * depth

  // Keep useMemo for WebGPU resources - must be stable object references
  const mouseUniform = useMemo(() => uniform(new THREE.Vector2(0.5, 0.5)), [])
  const flowFieldBuffer = useMemo(
    () => storage(new THREE.StorageInstancedBufferAttribute(FLOW_FIELD_SIZE, 1), 'float', FLOW_FIELD_SIZE),
    [FLOW_FIELD_SIZE],
  )

  // Memoize compute shaders and mesh - only recreate when essential props change
  const [computeUpdate, mesh] = useMemo(() => {
    const flowFieldInitFn = flowFieldFn({
      rows,
      columns,
      depth,
      flowFieldBuffer,
      params,
    }).compute(FLOW_FIELD_SIZE)
    gl.compute(flowFieldInitFn)

    // Particles compute
    const basePositionBuffer = storage(
      new THREE.StorageInstancedBufferAttribute(particlesCount, 4),
      'vec4',
      particlesCount,
    )
    const positionBuffer = storage(new THREE.StorageInstancedBufferAttribute(particlesCount, 4), 'vec4', particlesCount)

    // Assign a color buffer for each of the particles
    const colorArray = colorNodeFn ? new Float32Array(particlesCount * 3) : generateColorPalette(particlesCount)
    const colorBuffer = storage(new THREE.StorageInstancedBufferAttribute(colorArray, 3), 'vec3', particlesCount)

    const scaleBuffer = storage(new THREE.StorageInstancedBufferAttribute(particlesCount, 1), 'float', particlesCount)
    const opacityBuffer = storage(new THREE.StorageInstancedBufferAttribute(particlesCount, 1), 'float', particlesCount)
    const speedBuffer = storage(new THREE.StorageInstancedBufferAttribute(particlesCount, 1), 'float', particlesCount)

    // Halton sequence for better particle distribution (low-discrepancy sequence)
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

      // Use Halton sequence for better distribution (0 to 1 range, then scaled to -1 to 1)
      const haltonX = halton(instanceIndex, float(2)).mul(2).sub(1) // Base 2 for X
      const haltonY = halton(instanceIndex, float(3)).mul(2).sub(1) // Base 3 for Y
      const haltonZ = halton(instanceIndex, float(5)).mul(2).sub(1) // Base 5 for Z

      const p = vec4(
        haltonX,
        haltonY,
        haltonZ,
        hash(instanceIndex.mul(3)).mul(particleLifespan), // Keep hash for lifespan variation
      )
      position.assign(p)
      basePosition.assign(p)

      const scale = scaleBuffer.element(instanceIndex)
      scale.assign(particleScale)

      const opacity = opacityBuffer.element(instanceIndex)
      opacity.assign(particleOpacity)

      // randomise speed
      const speed = speedBuffer.element(instanceIndex)
      speed.assign(particleSpeed)
    })().compute(particlesCount)
    gl.compute(particlesInitFn)

    const xCellSize = 1 / columns
    const yCellSize = 1 / rows
    const zCellSize = 1 / depth

    // Compute update
    const particlesUpdate = Fn(() => {
      const updatePos = positionBuffer.element(instanceIndex).xyz
      const updateLifespan = positionBuffer.element(instanceIndex).w

      const particleAlive = updateLifespan.greaterThan(0)

      If(particleAlive, () => {
        // Get the normalised position of the particle (between 0 and 1)
        const normalisedParticlePosition = updatePos.add(1).div(2)
        const indexX = floor(normalisedParticlePosition.x.div(xCellSize))
        const indexY = floor(normalisedParticlePosition.y.div(yCellSize))
        const indexZ = floor(normalisedParticlePosition.z.div(zCellSize))

        // const flowFieldIndex = indexY.mul(columns).add(indexX)
        const flowFieldIndex = indexZ
          .mul(columns * rows)
          .add(indexY.mul(columns))
          .add(indexX)
        const angle = flowFieldBuffer.element(flowFieldIndex)

        // Calculate particle velocity based on flow field angle
        const speed = speedBuffer.element(instanceIndex).mul(updateLifespan)
        const x = select(flowFieldAngles[0] > 0, cos(angle).mul(speed), 0)
        const y = select(flowFieldAngles[1] > 0, sin(angle).mul(speed), 0)
        const z = select(flowFieldAngles[2] > 0, atan(angle).mul(speed), 0)

        updatePos.addAssign(vec3(x, y, z))
        updateLifespan.subAssign(particleDecay)

        // If a color node is provided, use that
        if (colorNodeFn) {
          const updateColor = colorBuffer.element(instanceIndex)
          updateColor.assign(colorNodeFn(angle, speed))
        }
      }).Else(() => {
        const basePosition = basePositionBuffer.element(instanceIndex)
        updatePos.assign(basePosition.xyz)
        updateLifespan.assign(basePosition.w)
      })
    })().compute(particlesCount)

    // As particles are only 1x1 pixels, we need a SpriteNodeMaterial to render larger particles
    const material = new THREE.SpriteNodeMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })

    // Make the positionBufer available to the shader as the positionNode
    material.positionNode = positionBuffer.toAttribute()
    material.scaleNode = scaleBuffer.toAttribute()
    material.colorNode = colorBuffer.toAttribute()

    material.opacityNode = opacityNodeFn
      ? opacityNodeFn(opacityBuffer)
      : Fn(() => {
          // Create circular particle shape using distance from center
          const circle = uv().xy.sub(0.7).length().step(0.3)
          return circle.mul(opacityBuffer.toAttribute())
        })()

    // Create an instanced mesh to display the particles, this is required as part of THREE for fallback
    const particlesMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, particlesCount)
    particlesMesh.frustumCulled = false

    return [particlesUpdate, particlesMesh]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Core dependencies - mesh only recreates if these change
    particlesCount,
    rows,
    columns,
    depth,
    flowFieldBuffer,
    FLOW_FIELD_SIZE,
  ])

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

  useFrame(async ({ gl }) => {
    // Update mouse uniform value if mousePosition is provided
    if (mousePosition) {
      mouseUniform.value.set(mousePosition.current.x, mousePosition.current.y)
    }

    await gl.computeAsync(computeUpdate)

    if (updateFlowField && flowFieldUpdateCompute) {
      await gl.computeAsync(flowFieldUpdateCompute)
    }
  })

  return <primitive object={mesh} scale={[width * 0.5, height * 0.5, 1]} ref={meshRef} />
}
