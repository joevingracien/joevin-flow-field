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
  mul,
  Loop,
  int,
  float,
} from 'three/tsl'
import colorPalettes from 'nice-color-palettes'

export const hexToRgbArray = (hex: string): number[] => {
  // @ts-ignore
  const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)

  // @ts-ignore
  return rgb ? rgb.slice(1).map((n) => parseInt(n, 16) / 255) : null
}

const generateColorPalette = (particlesCount: number) => {
  const allColors: any = []
  const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)]
  let paletteIndex = -1
  for (let i = 0; i < particlesCount; i += 5000) {
    paletteIndex += 1
    if (paletteIndex >= randomPalette.length) {
      paletteIndex = 0
    }

    for (let j = 0; j < 5000; j++) {
      const index = i + j
      if (index < particlesCount) {
        const c = hexToRgbArray(randomPalette[paletteIndex])
        allColors.push(c[0], c[1], c[2])
      }
    }
  }

  return new Float32Array(allColors)
}

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
  flowFieldAngles = [1, 1, 0],
  updateFlowField = false,
  params = {},
}: any) => {
  const meshRef = useRef<any>(null)
  const gl = useThree((state) => state.gl) as any
  const { width, height } = useThree((state) => state.size)

  const FLOW_FIELD_SIZE = columns * rows * depth

  const flowFieldBuffer = useMemo(
    () => storage(new THREE.StorageInstancedBufferAttribute(FLOW_FIELD_SIZE, 1), 'float', FLOW_FIELD_SIZE),
    [FLOW_FIELD_SIZE],
  )

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

    // Halton sequence for better particle distribution
    const halton = Fn(([index, base]) => {
      let result = float(0.0).toVar()
      let f = float(1.0).toVar()
      let i = float(index).toVar()

      Loop({ start: int(0), end: int(10), type: 'int', condition: '<' }, ({ i: loopIndex }) => {
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

      // Use Halton sequence for better distribution (0 to 1 range)
      const haltonX = halton(instanceIndex, float(2)).mul(2).sub(1) // Base 2
      const haltonY = halton(instanceIndex, float(3)).mul(2).sub(1) // Base 3
      const haltonZ = halton(instanceIndex, float(5)).mul(2).sub(1) // Base 5

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

        // Get the particles new position based on the angle provided
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
      // @ts-ignore
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
          // const lifespan = positionBuffer.element(instanceIndex).w
          const circle = uv().xy.sub(0.7).length().step(0.3)
          return circle.mul(opacityBuffer.toAttribute())
          // return circle.mul(lifespan).mul(opacityBuffer.toAttribute())
        })()

    // Create an instanced mesh to display the particles, this is required as part of THREE for fallback
    const particlesMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, particlesCount)
    particlesMesh.frustumCulled = false

    return [particlesUpdate, particlesMesh]
  }, [])

  useEffect(() => {
    if (!randomise) {
      return
    }

    const s = setInterval(async () => {
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
      clearInterval(s)
    }
  }, [])

  const flowFieldUpdate = flowFieldFn({
    rows,
    columns,
    depth,
    flowFieldBuffer,
    params,
  }).compute(FLOW_FIELD_SIZE)

  useFrame(async ({ gl }) => {
    // @ts-ignore
    // await gl.computeAsync(flowFieldUpdate)
    await gl.computeAsync(computeUpdate)

    if (updateFlowField) {
      // const flowFieldUpdate = flowFieldFn({
      //   rows,
      //   columns,
      //   flowFieldBuffer,
      //   params,
      // }).compute(FLOW_FIELD_SIZE)
      // @ts-ignore
      await gl.computeAsync(flowFieldUpdate)
    }
  })

  return <primitive object={mesh} scale={[width * 0.5, height * 0.5, 1]} ref={meshRef} />
}
