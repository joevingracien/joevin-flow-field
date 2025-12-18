'use client'

import { Fn, hash, instanceIndex, vec3, floor, uv, uniformArray } from 'three/tsl'
import { FlowField } from '@/components/canvas/FlowField'
import { sdBox2d } from '@/lib/tsl'

const network = Fn((props) => {
  const { flowFieldBuffer } = props

  const angles = uniformArray([
    0 * (Math.PI / 180),
    90 * (Math.PI / 180),
    180 * (Math.PI / 180),
    270 * (Math.PI / 180),
    360 * (Math.PI / 180),
  ])

  const angle = flowFieldBuffer.element(instanceIndex)

  const index = floor(hash(instanceIndex).mul(5))
  angle.assign(angles.element(index))
})

const customShapeFn = Fn(([opacityBuffer]) => {
  const box = sdBox2d(uv()).step(0.3)
  return box.mul(opacityBuffer.toAttribute())
})

const customColorFn = Fn(([]) => {
  const color = vec3(1, 0, 0)
  return color
})

export default function NetworkSketch() {
  return (
    <FlowField
      flowFieldFn={network}
      opacityNodeFn={customShapeFn}
      colorNodeFn={customColorFn}
      rows={32}
      columns={16}
      flowFieldAngles={[1, 1, 1]}
    />
  )
}
