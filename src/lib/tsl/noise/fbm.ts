import { Fn, float, vec3, Loop, mul, add, div, vec2 } from 'three/tsl'
import { simplexNoise3d } from './simplex-noise-3d'

/**
 * Fractal Brownian Motion (FBM) using 3D simplex noise.
 * Combines multiple octaves of noise at different frequencies and amplitudes.
 */
export const fbm = Fn(([p, octaves = 4.0, frequency = 1.0, amplitude = 1.0, lacunarity = 2.0, gain = 0.5]) => {
  const value = float(0.0).toVar()
  const currentAmplitude = float(amplitude).toVar()
  const currentFrequency = float(frequency).toVar()
  const maxValue = float(0.0).toVar()

  // @ts-ignore
  Loop({ start: 0.0, end: octaves, type: 'float' }, ({ i }) => {
    const noiseValue = simplexNoise3d(mul(p, currentFrequency))
    value.addAssign(mul(noiseValue, currentAmplitude))
    maxValue.addAssign(currentAmplitude)
    currentFrequency.mulAssign(lacunarity)
    currentAmplitude.mulAssign(gain)
  })

  return div(value, maxValue)
})

/**
 * Ridged FBM variant that creates sharp ridges.
 */
export const ridgedFbm = Fn(([p, octaves = 4.0, frequency = 1.0, amplitude = 1.0, lacunarity = 2.0, gain = 0.5]) => {
  const value = float(0.0).toVar()
  const currentAmplitude = float(amplitude).toVar()
  const currentFrequency = float(frequency).toVar()
  const maxValue = float(0.0).toVar()

  // @ts-ignore
  Loop({ start: 0.0, end: octaves, type: 'float' }, ({ i }) => {
    const noiseValue = simplexNoise3d(mul(p, currentFrequency))
    const ridgedValue = float(1.0).sub(noiseValue.abs())
    const sharpRidges = ridgedValue.mul(ridgedValue)
    value.addAssign(mul(sharpRidges, currentAmplitude))
    maxValue.addAssign(currentAmplitude)
    currentFrequency.mulAssign(lacunarity)
    currentAmplitude.mulAssign(gain)
  })

  return div(value, maxValue)
})

/**
 * Domain warped FBM that uses FBM to warp the input coordinates.
 */
export const domainWarpedFbm = Fn(
  ([p, octaves = 4.0, frequency = 1.0, amplitude = 1.0, lacunarity = 2.0, gain = 0.5, warpStrength = 0.1]) => {
    const warpOffset = vec3(
      fbm(p, octaves, frequency, amplitude, lacunarity, gain),
      fbm(add(p, vec3(100.0)), octaves, frequency, amplitude, lacunarity, gain),
      fbm(add(p, vec3(200.0)), octaves, frequency, amplitude, lacunarity, gain),
    )
    const warpedP = add(p, mul(warpOffset, warpStrength))
    return fbm(warpedP, octaves, frequency, amplitude, lacunarity, gain)
  },
)

/**
 * Warped FBM coordinates that uses FBM to warp the input coordinates.
 */
export const warpedFbmCoords = Fn(
  ([
    uv0,
    _time,
    frequency = 25,
    offset1 = 25,
    offset2 = 75,
    oscillation1 = 10,
    oscillation2 = 3,
    contribution1 = 0.2,
    contribution2 = 0.1,
  ]) => {
    const _uv = uv0.toVar()

    const warp1X = fbm(vec3(_uv.mul(oscillation1), _time))
    const warp1Y = fbm(vec3(_uv.mul(oscillation1).add(offset1), _time))
    const warp1 = vec2(warp1X, warp1Y).sub(0.5).mul(contribution1)
    const warpedUV1 = _uv.add(warp1)

    const warp2X = fbm(vec3(warpedUV1.mul(oscillation2), _time.mul(0.5)))
    const warp2Y = fbm(vec3(warpedUV1.mul(oscillation2).add(offset2), _time.mul(0.5)))
    const warp2 = vec2(warp2X, warp2Y).sub(0.5).mul(contribution2)
    const finalUV = warpedUV1.add(warp2)

    const n = simplexNoise3d(vec3(finalUV.mul(frequency), _time))
    return n
  },
)
