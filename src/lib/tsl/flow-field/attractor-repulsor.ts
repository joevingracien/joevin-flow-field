import { Fn, instanceIndex, floor, float, vec2, vec3, atan, PI, time, length, smoothstep, mix, sin, cos } from 'three/tsl'
import { simplexNoise3d } from '@/lib/tsl/noise'

/**
 * Gravity 8 - Organic vortex flow field with mouse attractor
 *
 * Creates a spiral/vortex pattern toward the attractor with organic noise.
 * The key is blending radial (toward) and tangential (perpendicular) movement
 * to create a swirling, drain-like effect rather than straight-line convergence.
 */
export const gravity8 = Fn((props: any) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const {
    attractorPos = vec2(0.5, 0.5),
    repulsorPos = vec2(0.2, 0.8),
    swirlAmount = 0.6,
    noiseScale = 4.0,
  } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)
  const pos = vec2(x.div(columns), y.div(rows))

  // Vector to attractor
  const toAttractor = attractorPos.sub(pos)
  const distToAttractor = length(toAttractor).max(0.001)

  // Radial angle (toward attractor)
  const radialAngle = atan(toAttractor.y, toAttractor.x)

  // Tangential angle (perpendicular - creates swirl)
  const tangentialAngle = radialAngle.add(PI.mul(0.5))

  // Dynamic swirl: more spiral when closer to attractor
  const proximityFactor = smoothstep(0.5, 0.0, distToAttractor)
  const dynamicSwirl = mix(float(swirlAmount).mul(0.4), float(swirlAmount), proximityFactor)

  // Blend radial and tangential for vortex effect
  const vortexAngle = mix(radialAngle, tangentialAngle, dynamicSwirl)

  // Repulsor influence (push away)
  const fromRepulsor = pos.sub(repulsorPos)
  const distToRepulsor = length(fromRepulsor).max(0.001)
  const repulsorAngle = atan(fromRepulsor.y, fromRepulsor.x)
  const repulsorWeight = float(0.15).div(distToRepulsor.add(0.5))

  // Base noise for organic variation
  // @ts-ignore
  const noiseVal = simplexNoise3d(vec3(pos.mul(noiseScale), time.mul(0.15)))
  const noiseAngle = noiseVal.mul(PI.mul(2))

  // Vector-based blending (avoids angle discontinuities)
  const attractorVec = vec2(cos(vortexAngle), sin(vortexAngle)).mul(0.7)
  const repulsorVec = vec2(cos(repulsorAngle), sin(repulsorAngle)).mul(repulsorWeight)
  const noiseVec = vec2(cos(noiseAngle), sin(noiseAngle)).mul(0.3)

  const combinedVec = attractorVec.add(repulsorVec).add(noiseVec)
  const finalAngle = atan(combinedVec.y, combinedVec.x)

  angle.assign(finalAngle)
})
