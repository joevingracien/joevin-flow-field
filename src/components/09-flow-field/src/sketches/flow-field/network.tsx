import { Fn, hash, instanceIndex, vec3, floor, uv, uniformArray } from 'three/tsl'
import { FlowField } from '@/components/flow_field/flow_field'
import { sdBox2d } from '@/tsl/utils/sdf/shapes'

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
      flowFieldFn={network}
      opacityNodeFn={customShapeFn}
      colorNodeFn={customColorFn}
      rows={32}
      columns={16}
      flowFieldAngles={[1, 1, 1]}
    />
  )
}

export default Sketch
