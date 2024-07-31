import * as THREE from 'three'

export function getDataTexture(size, spread = 2.0) {
  let number = size * size
  const data = new Float32Array(4 * number)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const index = i * size + j

      // Original position
      let x = 6 * (i / size - 0.5)
      let y = 6 * (j / size - 0.5)

      // Add spread effect
      let spreadX = Math.cos(i * 1000 + j * 2000) * spread
      let spreadY = Math.sin(j * 1000 + i * 2000) * spread

      data[4 * index] = x + spreadX
      data[4 * index + 1] = y + spreadY
      data[4 * index + 2] = 0 // You can add z-axis spread here if needed
      data[4 * index + 3] = 0 // This could be used to store the original position if needed
    }
  }

  let dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType)
  dataTexture.needsUpdate = true

  return dataTexture
}
