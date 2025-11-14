import { randomFromRange } from '@/utils/math'
import {
  vec2,
  Fn,
  cos,
  sin,
  float,
  instanceIndex,
  vec3,
  atan,
  floor,
  hash,
  uniformArray,
  length,
  mix,
  sqrt,
  abs,
  pow,
} from 'three/tsl'
import { perlinNoise3d } from '@/tsl/noise/perlin_noise_3d'

export const spiral = Fn((props) => {
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

export const fundament = Fn((props) => {
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

export const cellular = Fn((props) => {
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

export const network = Fn((props) => {
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

export const monde = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { curve = 10 } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)

  const _curve = float(curve).add(randomFromRange(-0.15, 0.15))
  const inc = randomFromRange(0.05, 0.1)
  const yOff = y.mul(inc)
  const xOff = x.mul(inc)

  const newAngle = perlinNoise3d(vec3(xOff, yOff, x.add(y).mul(inc))).mul(_curve)

  angle.assign(newAngle)
})

export const concentric = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { radius = 3 } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)

  // Determine the centre of the grid so we can determine the angle (theta)
  const centerX = floor(rows.div(2))
  const centerY = floor(columns.div(2))

  const normalizedX = x.sub(centerX)
  const normalizedY = y.sub(centerY)

  // Get the angle, and the perpendicular angle so we can shape the flow field
  // into a circle
  const theta = atan(normalizedY, normalizedX)
  const perpendicularTheta = theta.add(Math.PI / 2)

  // Get the distance from the centre of the grid, then normalize it so we can
  // use it in a mix function
  const d = length(vec2(normalizedX, normalizedY))
  const maxD = sqrt(centerX.pow(2).add(centerY.pow(2)))
  const normalizedD = d.div(maxD)

  // Mix between the two angle - this should give us a ring shape
  // but also swirl particles towards the ring
  angle.assign(mix(theta, perpendicularTheta, normalizedD.mul(radius)))
})

export const flow = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { amplitude = Math.PI } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)

  // Determine the centre of the grid so we can determine the angle (theta)
  const centerX = floor(columns.div(2))
  const centerY = floor(rows.div(2))

  // Center around (0,0)
  const normalizedX = x.div(columns)
  const normalizedY = y.sub(centerY).div(rows.div(2))

  const magnitude = sin(normalizedX.mul(Math.PI * 6)).mul(30)
  const theta = atan(normalizedY.mul(magnitude).mul(100), x).toVar()

  theta.assign(mix(theta.add(atan(cos(y), sin(x).mul(0.5))), theta, pow(abs(y.sub(centerY)), 0.02)))

  angle.assign(theta)
})
