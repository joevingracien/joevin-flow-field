import { Fn, instanceIndex, floor, float, vec2, atan, mul, PI, time } from 'three/tsl'
import { simplexNoise3d } from '@/tsl/noise/simplex_noise_3d'

/**
 * Gravity 8 - Hybrid flow field with attractors, repulsors, and noise
 *
 * This function creates a complex flow field that combines:
 * - Attractor influence: Particles are drawn toward a specific point
 * - Repulsor influence: Particles are pushed away from another point
 * - Noise influence: Organic variation through simplex noise
 *
 * All influences are blended together to create rich, varied motion patterns.
 */
export const gravity8 = Fn((props: any) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const {
    attractorPos = vec2(0.5, 0.5),
    repulsorPos = vec2(0.2, 0.8),
    strength = 2.0,
    noiseScale = 8.0,
    blendFactor = 0.5,
  } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)
  const pos = vec2(x.div(columns), y.div(rows))

  // Attractor influence
  const toAttractor = attractorPos.sub(pos)
  const attractorAngle = atan(toAttractor.y, toAttractor.x).mul(strength)

  // Repulsor influence
  const fromRepulsor = pos.sub(repulsorPos)
  const repulsorAngle = atan(fromRepulsor.y, fromRepulsor.x).mul(mul(strength, 0.5))

  // Noise field influence
  // @ts-ignore
  const noiseAngle = simplexNoise3d(pos.mul(noiseScale).add(time)).mul(PI.mul(2))

  // Blend all influences
  const blendedAngle = attractorAngle.mul(blendFactor).add(repulsorAngle.mul(0.3)).add(noiseAngle.mul(0.2))

  angle.assign(blendedAngle)
})
