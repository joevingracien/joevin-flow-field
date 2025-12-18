'use client'

import { Fn, time, float, instanceIndex, vec3, floor, uv, PI } from 'three/tsl'
import { FlowField } from '@/components/canvas/FlowField'
import { sdBox2d, perlinNoise3d } from '@/lib/tsl'

const noiseField = Fn((props) => {
  const { rows, columns, depth, flowFieldBuffer, params } = props

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const z = floor(float(instanceIndex.div(columns.mul(rows))))
  const angle = flowFieldBuffer.element(instanceIndex)

  // Scale down coordinates to get smoother noise
  const scale = float(0.005)
  const t = time.mul(0.05)

  // Sample noise with time evolution
  const noise = perlinNoise3d(vec3(x.mul(scale), y.mul(scale), z.mul(scale).add(t))).mul(PI.mul(2))

  angle.assign(noise)
})

const customShapeFn = Fn(([opacityBuffer]) => {
  const box = sdBox2d(uv()).step(0.3)
  return box.mul(opacityBuffer.toAttribute())
})

const customColorFn = Fn(([]) => {
  const color = vec3(1, 0, 0)
  return color
})

export default function Noise3DSketch() {
  return (
    <FlowField
      flowFieldFn={noiseField}
      opacityNodeFn={customShapeFn}
      colorNodeFn={customColorFn}
      flowFieldAngles={[1, 1, 1]}
      rows={512}
      columns={512}
      depth={64}
      updateFlowField
    />
  )
}
