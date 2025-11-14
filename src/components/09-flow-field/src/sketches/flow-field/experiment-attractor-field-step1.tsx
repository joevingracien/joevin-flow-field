import { Fn, float, instanceIndex, vec3, floor, uv, vec2, atan, length } from 'three/tsl'
import { FlowField } from '@/components/flow_field/flow_field'
import { sdBox2d } from '@/tsl/utils/sdf/shapes'

const attractorField = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { attractorPos = vec2(0.5, 0.5), strength = 2.0 } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)

  // Normalize coordinates
  const pos = vec2(x.div(columns), y.div(rows))

  // Calculate direction to attractor
  const toAttractor = attractorPos.sub(pos)
  const distance = length(toAttractor)

  // Create angle based on direction to attractor
  const newAngle = atan(toAttractor.y, toAttractor.x).mul(strength)

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
  return <FlowField flowFieldFn={attractorField} opacityNodeFn={customShapeFn} colorNodeFn={customColorFn} />
}

export default Sketch
