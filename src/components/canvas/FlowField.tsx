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

    const basePositionBuffer = storage(basePositionAttr, 'vec4', particlesCount)
    const positionBuffer = storage(positionAttr, 'vec4', particlesCount)
    const colorBuffer = storage(colorAttr, 'vec3', particlesCount)
    const scaleBuffer = storage(scaleAttr, 'float', particlesCount)
    const opacityBuffer = storage(opacityAttr, 'float', particlesCount)
    const speedBuffer = storage(speedAttr, 'float', particlesCount)

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
        const normalisedParticlePosition = updatePos.add(1).div(2)
        const indexX = floor(normalisedParticlePosition.x.div(xCellSize))
        const indexY = floor(normalisedParticlePosition.y.div(yCellSize))
        const indexZ = floor(normalisedParticlePosition.z.div(zCellSize))

        const flowFieldIndex = indexZ.mul(columns * rows).add(indexY.mul(columns)).add(indexX)
        const angle = flowFieldBuffer.element(flowFieldIndex)

        const speed = speedBuffer.element(instanceIndex).mul(updateLifespan)
        const x = flowFieldAngles[0] > 0 ? cos(angle).mul(speed) : float(0)
        const y = flowFieldAngles[1] > 0 ? sin(angle).mul(speed) : float(0)
        const z = flowFieldAngles[2] > 0 ? atan(angle).mul(speed) : float(0)

        updatePos.addAssign(vec3(x, y, z))
        updateLifespan.subAssign(particleDecay)

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

    const material = new THREE.SpriteNodeMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })

    material.positionNode = positionBuffer.toAttribute()
    material.scaleNode = scaleBuffer.toAttribute()
    material.colorNode = colorBuffer.toAttribute()

    material.opacityNode = opacityNodeFn
      ? opacityNodeFn(opacityBuffer)
      : Fn(() => {
          const circle = uv().xy.sub(0.7).length().step(0.3)
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
