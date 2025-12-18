'use client'

import { Fn, cos, sin, float, instanceIndex, vec3, floor, uv } from 'three/tsl'
import { FlowField } from '@/components/canvas/FlowField'
import { sdBox2d } from '@/lib/tsl'
import { randomFromRange } from '@/lib/utils'

const fundament = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { zoom = 0.015, curve = 8 } = params || {}

  const _zoom = float(zoom).add(randomFromRange(-0.01, 0.01))
  const _curve = float(curve).add(randomFromRange(-1, 1))

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)

  const _c = cos(x.mul(_zoom))
  const _s = sin(y.mul(_zoom))
  const _p = _c.add(_s)
  const newAngle = _p.mul(_curve)
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

export default function FundamentSketch() {
  return (
    <FlowField
      flowFieldFn={fundament}
      opacityNodeFn={customShapeFn}
      colorNodeFn={customColorFn}
      rows={256}
      columns={256}
      flowFieldAngles={[1, 1, 1]}
    />
  )
}
