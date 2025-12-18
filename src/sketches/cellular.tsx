'use client'

import { Fn, hash, float, instanceIndex, vec3, floor, uv } from 'three/tsl'
import { FlowField } from '@/components/canvas/FlowField'
import { sdBox2d, perlinNoise3d } from '@/lib/tsl'

const cellular = Fn((props) => {
  const { columns, flowFieldBuffer, params } = props
  const { amplitude = 2 } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)

  const increment = float(0.5)
  const xOff = x.mul(increment)
  const yOff = y.mul(increment)

  const newAngle = perlinNoise3d(vec3(xOff, yOff, hash(instanceIndex))).mul(amplitude)

  angle.assign(newAngle)
})

const customShapeFn = Fn(([opacityBuffer]) => {
  const box = sdBox2d(uv()).step(0.3)
  return box.mul(opacityBuffer.toAttribute())
})

const customColorFn = Fn(([]) => {
  const color = vec3(1, 0, 0)
  return color
})

export default function CellularSketch() {
  return (
    <FlowField
      flowFieldFn={cellular}
      opacityNodeFn={customShapeFn}
      colorNodeFn={customColorFn}
      rows={128}
      columns={128}
    />
  )
}
