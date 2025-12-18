'use client'

import { Fn, cos, sin, float, instanceIndex, vec3, floor, uv } from 'three/tsl'
import { FlowField } from '@/components/canvas/FlowField'
import { sdBox2d } from '@/lib/tsl'
import { randomFromRange } from '@/lib/utils'

const spiral = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { zoom = 0.015, curve = -3 } = params || {}

  const _zoom = float(zoom).add(randomFromRange(-0.01, 0.01))
  const _curve = float(curve).add(randomFromRange(-0.25, 0.25))

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

export default function SpiralSketch() {
  return (
    <FlowField
      flowFieldFn={spiral}
      opacityNodeFn={customShapeFn}
      colorNodeFn={customColorFn}
      rows={1024}
      columns={1024}
      particlesCount={Math.pow(2, 18)}
      particleScale={0.002}
      particleOpacity={0.15}
      particleSpeed={0.01}
      particleLifespan={1}
      particleDecay={0.001}
    />
  )
}
