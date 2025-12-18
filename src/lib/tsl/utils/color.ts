import { Fn, float, cos } from 'three/tsl'

/**
 * Generates a palette of colors using a cosine-based function
 * @param t Time/position parameter between 0-1
 * @param a Base color offset
 * @param b Color amplitude
 * @param c Color frequency
 * @param d Phase offset
 * @param e Cosine scalar
 * @returns RGB color value
 */
export const cosinePalette = Fn(([t, a, b, c, d, e = float(6.28318)]) => {
  return a.add(b.mul(cos(e.mul(c.mul(t).add(d)))))
})
