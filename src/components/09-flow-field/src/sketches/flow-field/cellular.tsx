import { Fn, hash, float, instanceIndex, vec3, floor, uv } from 'three/tsl'
import { FlowField } from '@/components/flow_field/flow_field'
import { sdBox2d } from '@/tsl/utils/sdf/shapes'
import { perlinNoise3d } from '@/tsl/noise/perlin_noise_3d'

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
      flowFieldFn={cellular}
      opacityNodeFn={customShapeFn}
      colorNodeFn={customColorFn}
      rows={128}
      columns={128}
    />
  )
}

export default Sketch
