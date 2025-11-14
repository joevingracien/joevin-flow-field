import { Fn, cos, sin, float, instanceIndex, vec3, floor, uv } from 'three/tsl'
import { FlowField } from '@/components/flow_field/flow_field'
import { randomFromRange } from '@/utils/math'
import { sdBox2d } from '@/tsl/utils/sdf/shapes'

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

// If we want a custom shape, use the opacityNode prop
const customShapeFn = Fn(([opacityBuffer]) => {
  const box = sdBox2d(uv()).step(0.3)
  return box.mul(opacityBuffer.toAttribute())
})

// If we want a custom color, use the colorNodeFn prop
const customColorFn = Fn(([]) => {
  // Make our flow field particles red
  const color = vec3(1, 0, 0)
  return color
})

const Sketch = () => {
  return (
    <FlowField
      flowFieldFn={spiral}
      opacityNodeFn={customShapeFn}
      colorNodeFn={customColorFn}
      // Add or remove rows and columns to change the complexity of the flow field
      rows={1024}
      columns={1024}
      // Change these props to alter particle attributes
      particlesCount={Math.pow(2, 18)}
      particleScale={0.002}
      particleOpacity={0.15}
      particleSpeed={0.01}
      particleLifespan={1}
      particleDecay={0.001}
    />
  )
}

export default Sketch
