import { Fn, time, float, instanceIndex, vec3, floor, uv, PI } from 'three/tsl'
import { FlowField } from '@/components/flow_field/flow_field'
import { sdBox2d } from '@/tsl/utils/sdf/shapes'
import { perlinNoise3d } from '@/tsl/noise/perlin_noise_3d'

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
  const noise = perlinNoise3d(vec3(x.mul(scale), y.mul(scale), z.mul(scale).add(t))).mul(PI.mul(2)) // Scale to full rotation

  angle.assign(noise)
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
      flowFieldFn={noiseField}
      opacityNodeFn={customShapeFn}
      colorNodeFn={customColorFn}
      flowFieldAngles={[1, 1, 1]}
      rows={512}
      columns={512}
      // Note that depth is very sensitive to performance, so experiment with this for interesting results
      depth={64}
      updateFlowField
    />
  )
}

export default Sketch
