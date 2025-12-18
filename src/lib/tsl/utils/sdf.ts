import {
  Fn,
  length,
  min,
  max,
  abs,
  vec2,
  sqrt,
  sign,
  float,
  dot,
  vec3,
  If,
  clamp,
  select,
  mul,
  sub,
  add,
} from 'three/tsl'

/**
 * Returns a sphere SDF based on a given uv and radius.
 */
export const sdSphere = Fn(([_uv, r = float(0.0)]) => {
  const _r = float(r)
  return length(_uv).sub(_r)
})

/**
 * Returns a 2d box SDF based on a given uv and size.
 */
export const sdBox2d = Fn(([_uv, _size = float(0.0)]) => {
  return max(abs(_uv.x), abs(_uv.y)).sub(_size)
})

/**
 * Returns a 3d box SDF based on a given point and size.
 */
export const sdBox3d = Fn(([p, b]) => {
  const q = abs(p).sub(b)
  return length(max(q, 0.0)).add(min(max(q.x, max(q.y, q.z)), 0.0))
})

/**
 * Returns a diamond SDF based on a given uv and radius.
 */
export const sdDiamond = Fn(([_uv, r = 0.0]) => {
  return abs(_uv.x).add(abs(_uv.y)).sub(r)
})

/**
 * Returns a hexagon SDF based on a given point and radius.
 */
export const sdHexagon = Fn(([p = vec2(0), _r = 0.5]) => {
  const r = float(_r)
  const k = vec3(-0.866025404, 0.5, 0.577350269)

  const _p = abs(p).toVar()
  _p.subAssign(float(2.0).mul(min(dot(k.xy, _p), 0.0).mul(k.xy)))
  _p.subAssign(vec2(clamp(_p.x, k.z.negate().mul(r), k.z.mul(r)), r))

  return length(_p).mul(sign(_p.y))
})

/**
 * Returns an equilateral triangle SDF based on a given point and radius.
 */
export const sdEquilateralTriangle = Fn(([p = vec2(0), _r = float(0.1)]) => {
  const r = float(_r)
  const k = sqrt(3.0)
  const _p = p.toVar()

  _p.x = abs(_p.x).sub(r).toVar()
  _p.y = _p.y.add(r.div(k)).toVar()

  If(_p.x.add(k.mul(_p.y)).greaterThan(0), () => {
    _p.assign(vec2(_p.x.sub(k.mul(_p.y)), k.negate().mul(_p.x).sub(_p.y)).div(2))
  })

  _p.x.subAssign(clamp(_p.x, r.mul(-2), 0.0))
  return length(_p).negate().mul(sign(_p.y))
})

/**
 * Returns a line SDF for a given coordinate.
 */
export const sdLine = Fn(([p]) => {
  return abs(p)
})

/**
 * Returns a ring SDF based on a given uv and radius.
 */
export const sdRing = Fn(([_uv, s = 0.4]) => {
  return abs(length(_uv).sub(s)).toVar()
})

/**
 * Returns a parallelogram SDF based on a given uv and size.
 */
export const sdParallelogram = Fn(([_p, wi, he, sk]) => {
  const p = _p.toVar()
  const e = vec2(sk, he)

  p.assign(select(p.y.lessThan(0.0), p.negate(), p))

  const w = p.sub(e)
  w.x.subAssign(clamp(w.x, wi.negate(), wi))

  const d = vec2(dot(w, w), w.y.negate()).toVar()
  const s = p.x.mul(e.y).sub(p.y.mul(e.x))

  p.assign(select(s.lessThan(0.0), p.negate(), p))

  const v = p.sub(vec2(wi, 0)).toVar()

  v.subAssign(e.mul(clamp(dot(v, e).div(dot(e, e)), -1.0, 1.0)))
  d.assign(min(d, vec2(dot(v, v), wi.mul(he).sub(abs(s)))))

  return sqrt(d.x).mul(sign(d.y.negate()))
})

const ndot = Fn(([a, b]) => {
  return a.x.mul(b.x).sub(a.y.mul(b.y))
})

/**
 * Returns a rhombus SDF based on a given uv and size.
 */
export const sdRhombus = Fn(([_p, b]) => {
  const p = _p.toVar()
  p.assign(abs(p))
  const h = clamp(ndot(b.sub(mul(2.0, p)), b).div(dot(b, b)), -1.0, 1.0)
  const d = length(p.sub(mul(0.5, b).mul(vec2(sub(1.0, h), add(1.0, h)))))

  return d.mul(sign(p.x.mul(b.y).add(p.y.mul(b.x).sub(b.x.mul(b.y)))))
})

/**
 * Returns a triangle SDF based on a given uv and size.
 */
export const sdTriangle = Fn(([_p, size]) => {
  const t = max(abs(_p.x.mul(size)).add(_p.y), abs(_p.y.mul(size).sub(0.5)).sub(0.5))
  return t
})
