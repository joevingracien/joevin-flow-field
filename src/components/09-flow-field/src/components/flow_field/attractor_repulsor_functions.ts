import { Fn, instanceIndex, length, time, vec2, floor, float, atan, PI, smoothstep, step, add, mul } from 'three/tsl'
import { simplexNoise3d } from '@/tsl/noise/simplex_noise_3d'

export const gravity1 = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { attractorPos = vec2(0.5, 0.5), strength = 3.0 } = params || {}

  // Calculate grid position from instance index
  // instanceIndex is a flat index (0, 1, 2, ...) for each point in the flow field
  const x = floor(float(instanceIndex.mod(columns))) // Column position (0 to columns-1)
  const y = floor(float(instanceIndex.div(columns))) // Row position (0 to rows-1)

  // Get the current angle value stored at this grid position
  const angle = flowFieldBuffer.element(instanceIndex)

  // Normalize grid coordinates to 0-1 range for easier positioning
  // This gives us UV coordinates where (0,0) is top-left, (1,1) is bottom-right
  const pos = vec2(x.div(columns), y.div(rows))

  // Calculate vector pointing from current position toward the attractor
  const toAttractor = attractorPos.sub(pos)
  // const distance = length(toAttractor) // Distance to attractor (currently unused but useful for extensions)

  // // Create a spiral effect by adding an angle offset based on distance
  // const spiralOffset = distance.mul(PI.mul(3.0))
  // const distanceWeight = smoothstep(0.8, 0.0, distance) // Stronger effect closer to attractor
  // const newAngle = atan(toAttractor.y, toAttractor.x).add(spiralOffset).mul(strength).mul(distanceWeight)

  // Convert the direction vector to an angle using atan2
  // atan(y, x) gives us the angle in radians from the positive x-axis
  // Multiply by strength to amplify or dampen the effect
  const newAngle = atan(toAttractor.y, toAttractor.x).mul(strength)

  // Store the calculated angle back into the flow field buffer
  angle.assign(newAngle)
})

export const gravity2 = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { attractorPos = vec2(0.5, 0.5), strength = 3.0 } = params || {}

  // Calculate grid position from instance index
  // instanceIndex is a flat index (0, 1, 2, ...) for each point in the flow field
  const x = floor(float(instanceIndex.mod(columns))) // Column position (0 to columns-1)
  const y = floor(float(instanceIndex.div(columns))) // Row position (0 to rows-1)

  // Get the current angle value stored at this grid position
  const angle = flowFieldBuffer.element(instanceIndex)

  // Normalize grid coordinates to 0-1 range for easier positioning
  // This gives us UV coordinates where (0,0) is top-left, (1,1) is bottom-right
  const pos = vec2(x.div(columns), y.div(rows))

  // Calculate vector pointing from current position toward the attractor
  const toAttractor = attractorPos.sub(pos)
  const distance = length(toAttractor) // Distance to attractor (currently unused but useful for extensions)

  // // Create a spiral effect by adding an angle offset based on distance
  const spiralOffset = distance.mul(PI.mul(35.0))
  const distanceWeight = smoothstep(0.9, 0.0, distance) // Stronger effect closer to attractor
  const newAngle = atan(toAttractor.y, toAttractor.x).add(spiralOffset).mul(strength).mul(distanceWeight)

  // Store the calculated angle back into the flow field buffer
  angle.assign(newAngle)
})

// Enhanced attractor field with distance falloff
export const gravity3 = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { attractorPos = vec2(0.5, 0.5), strength = 2.0, falloffDistance = 1.5 } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)
  const pos = vec2(x.div(columns), y.div(rows))

  const toAttractor = attractorPos.sub(pos)
  const distance = length(toAttractor)

  // Apply smooth falloff based on distance
  const falloff = smoothstep(falloffDistance, 0.0, distance)
  const newAngle = atan(toAttractor.y, toAttractor.x).mul(strength).mul(falloff)

  angle.assign(newAngle)
})

// Multi-attractor field with distance-weighted blending
export const gravity4 = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const {
    attractor1 = vec2(0.35, 0.35),
    attractor2 = vec2(0.65, 0.65),
    // attractor3 = vec2(0.5, 0.5),
    strength = 3.0,
  } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)
  const pos = vec2(x.div(columns), y.div(rows))

  // Calculate influence from each attractor
  const toAttractor1 = attractor1.sub(pos)
  const toAttractor2 = attractor2.sub(pos)
  // const toAttractor3 = attractor3.sub(pos)

  const dist1 = length(toAttractor1)
  const dist2 = length(toAttractor2)
  // const dist3 = length(toAttractor3)

  // Weight by inverse distance (closer = stronger influence)
  const weight1 = float(1.0).div(dist1.add(0.5))
  const weight2 = float(1.0).div(dist2.add(0.5))
  // const weight3 = float(1.0).div(dist3.add(0.01))
  const totalWeight = weight1.add(weight2) //.add(weight3)

  // Blend angles based on weights
  const angle1 = atan(toAttractor1.y, toAttractor1.x)
  const angle2 = atan(toAttractor2.y, toAttractor2.x)
  // const angle3 = atan(toAttractor3.y, toAttractor3.x)
  const blendedAngle = angle1
    .mul(weight1.div(totalWeight))
    .add(angle2.mul(weight2.div(totalWeight)))
    // .add(angle3.mul(weight3.div(totalWeight)))
    .mul(strength)

  angle.assign(blendedAngle)
})

// Orbital attractor field (creates circular flow around attractors)
export const gravity5 = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { attractorPos = vec2(0.5, 0.5), strength = 3.0, orbitalStrength = 2.0 } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)
  const pos = vec2(x.div(columns), y.div(rows))

  const toAttractor = attractorPos.sub(pos)
  const distance = length(toAttractor)

  // Create orbital motion by adding 90 degrees to the attraction angle
  const attractionAngle = atan(toAttractor.y, toAttractor.x)
  const orbitalAngle = attractionAngle.add(PI.div(2))

  // Blend between attraction and orbital motion
  const finalAngle = attractionAngle
    .mul(strength)
    .add(orbitalAngle.mul(orbitalStrength))
    .div(add(strength, orbitalStrength))

  angle.assign(finalAngle)
})

// Repulsor field (pushes particles away)
export const gravity6 = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { repulsorPos = vec2(0.5, 0.5), strength = 2.0, falloffDistance = 0.45 } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)
  const pos = vec2(x.div(columns), y.div(rows))

  // Flip the direction vector to push away instead of attract
  const fromRepulsor = pos.sub(repulsorPos)
  const distance = length(fromRepulsor)

  // Stronger repulsion when closer
  const falloff = smoothstep(falloffDistance, 0.0, distance)
  const newAngle = atan(fromRepulsor.y, fromRepulsor.x).mul(strength).mul(falloff)

  angle.assign(newAngle)
})

// Noisy attractor field with organic perturbation
export const gravity7 = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { attractorPos = vec2(0.75, 0.5), strength = 2.0, noiseScale = 10.0, noiseStrength = 0.5 } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)
  const pos = vec2(x.div(columns), y.div(rows))

  const toAttractor = attractorPos.sub(pos)
  const baseAngle = atan(toAttractor.y, toAttractor.x).mul(strength)

  // Add noise perturbation for organic movement
  const noiseValue = simplexNoise3d(pos.mul(noiseScale).add(time))
  const perturbedAngle = baseAngle.add(noiseValue.mul(noiseStrength))

  angle.assign(perturbedAngle)
})

// Zoned attractor field with conditional behavior
export const gravity9 = Fn((props) => {
  const { rows, columns, flowFieldBuffer, params } = props
  const { attractorPos = vec2(0.5, 0.5), strength = 2.0, innerRadius = 0.25, outerRadius = 0.45 } = params || {}

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const angle = flowFieldBuffer.element(instanceIndex)
  const pos = vec2(x.div(columns), y.div(rows))

  const toAttractor = attractorPos.sub(pos)
  const distance = length(toAttractor)

  // Different behaviors for different zones
  const innerZone = step(distance, innerRadius)
  const outerZone = step(outerRadius, distance)
  const middleZone = float(1.0).sub(innerZone).sub(outerZone)

  // Inner zone: orbital motion
  const orbitalAngle = atan(toAttractor.y, toAttractor.x).add(PI.div(2))

  // Middle zone: normal attraction
  const attractionAngle = atan(toAttractor.y, toAttractor.x)

  // Outer zone: no influence
  const finalAngle = innerZone
    .mul(orbitalAngle.mul(strength))
    .add(middleZone.mul(attractionAngle.mul(strength)))
    .add(outerZone.mul(0.0))

  angle.assign(finalAngle)
})

// Hybrid field combining multiple techniques
export const gravity8 = Fn((props) => {
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
  const noiseAngle = simplexNoise3d(pos.mul(noiseScale).add(time)).mul(PI.mul(2))

  // Blend all influences
  const blendedAngle = attractorAngle.mul(blendFactor).add(repulsorAngle.mul(0.3)).add(noiseAngle.mul(0.2))

  angle.assign(blendedAngle)
})
