import { Fn, cos, sin, float, instanceIndex, vec3, floor, uv } from 'three/tsl'
import { FlowField } from '@/components/flow_field/flow_field'
import { randomFromRange } from '@/utils/math'
import { sdBox2d } from '@/tsl/utils/sdf/shapes'

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
      flowFieldFn={fundament}
      opacityNodeFn={customShapeFn}
      colorNodeFn={customColorFn}
      rows={256}
      columns={256}
      flowFieldAngles={[1, 1, 1]}
    />
  )
}

export default Sketch
