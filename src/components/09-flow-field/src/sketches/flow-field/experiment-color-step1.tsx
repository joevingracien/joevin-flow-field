import { Fn, float, instanceIndex, vec3, floor, PI, cos, sin, time } from 'three/tsl'
import { FlowField } from '@/components/flow_field/flow_field'
import { perlinNoise3d } from '@/tsl/noise/perlin_noise_3d'
import { cosinePalette } from '@/tsl/utils/color/cosine_palette'

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

// If we want a custom color, use the colorNodeFn prop
const customColorFn = Fn(([angle, speed]) => {
  const a = vec3(0.5, 0.5, 0.5)
  const b = vec3(0.5, 0.5, 0.5)
  const c = vec3(1.0, 1.0, 0.5)
  const d = vec3(0.8, 0.9, 0.3)

  return cosinePalette(cos(angle).add(sin(angle)).mul(0.1).add(time.mul(0.1)), a, b, c, d)
})

const Sketch = () => {
  return (
    <FlowField
      flowFieldFn={noiseField}
      colorNodeFn={customColorFn}
      flowFieldAngles={[1, 1, 1]}
      rows={512}
      columns={512}
      depth={1}
      updateFlowField
    />
  )
}

export default Sketch
