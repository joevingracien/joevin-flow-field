import { useRef, useEffect } from 'react'
import { extend, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { SpriteNodeMaterial } from 'three/webgpu'
import { useTexture } from '@react-three/drei'
import {
  texture,
  vec2,
  vec3,
  float,
  Fn,
  instanceIndex,
  instancedArray,
  uniform,
  If,
  uint,
} from 'three/tsl'

extend({ SpriteNodeMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    spriteNodeMaterial: any
  }
}

const SIZE = 256
const COUNT = SIZE * SIZE

export function ParticlesWebGPU() {
  const photoTexture = useTexture('/img/photospaceme.webp')
  const { gl } = useThree()

  const systemRef = useRef<any>(null)
  const mousePos = useRef(new THREE.Vector2(9999, 9999))

  // Create system ONCE
  if (!systemRef.current && photoTexture) {
    const positionBuffer = instancedArray(COUNT, 'vec3')
    const velocityBuffer = instancedArray(COUNT, 'vec3')
    const originalPosBuffer = instancedArray(COUNT, 'vec3')
    const mouseUniform = uniform(vec2(9999, 9999))

    const position = positionBuffer.element(instanceIndex)
    const velocity = velocityBuffer.element(instanceIndex)
    const originalPos = originalPosBuffer.element(instanceIndex)

    const computeInit = Fn(() => {
      const i = instanceIndex.div(uint(SIZE)).toFloat()
      const j = instanceIndex.mod(uint(SIZE)).toFloat()
      const x = i.div(SIZE - 1).mul(4).sub(2)
      const y = j.div(SIZE - 1).mul(4).sub(2)
      position.assign(vec3(x, y, 0))
      originalPos.assign(vec3(x, y, 0))
      velocity.assign(vec3(0, 0, 0))
    })()

    const computeUpdate = Fn(() => {
      velocity.mulAssign(0.9)

      const toOriginal = originalPos.sub(position)
      const dist = toOriginal.length()
      If(dist.greaterThan(0.001), () => {
        velocity.addAssign(toOriginal.mul(0.01))
      })

      const dx = position.x.sub(mouseUniform.x)
      const dy = position.y.sub(mouseUniform.y)
      const mouseDist = dx.mul(dx).add(dy.mul(dy)).sqrt()

      If(mouseDist.lessThan(1.2), () => {
        const force = float(1.2).sub(mouseDist).div(1.2).mul(0.3)
        If(mouseDist.greaterThan(0.01), () => {
          velocity.x.addAssign(dx.div(mouseDist).mul(force))
          velocity.y.addAssign(dy.div(mouseDist).mul(force))
        })
      })

      position.addAssign(velocity)
    })()

    const uvX = instanceIndex.div(uint(SIZE)).toFloat().div(SIZE)
    const uvY = instanceIndex.mod(uint(SIZE)).toFloat().div(SIZE)

    systemRef.current = {
      computeInitNode: computeInit.compute(COUNT),
      computeUpdateNode: computeUpdate.compute(COUNT),
      mouseUniform,
      positionNode: positionBuffer.toAttribute(),
      colorNode: texture(photoTexture, vec2(uvX, uvY)),
      scaleNode: float(0.01),
    }

    console.log('✅ Particle system created ONCE')
  }

  // Init compute ONCE
  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current && gl && systemRef.current) {
      const renderer = gl as any
      renderer.computeAsync?.(systemRef.current.computeInitNode)
      initialized.current = true
      console.log('✅ Compute initialized')
    }
  }, [gl])

  // Mouse handlers
  useEffect(() => {
    const handleMouse = (e: MouseEvent | Touch) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -(e.clientY / window.innerHeight) * 2 + 1
      mousePos.current.set(x * 2 * (window.innerWidth / window.innerHeight), y * 2)
    }

    const onMouseMove = (e: MouseEvent) => handleMouse(e)
    const onTouchMove = (e: TouchEvent) => e.touches[0] && handleMouse(e.touches[0])

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  // Update loop
  useFrame(() => {
    if (!systemRef.current || !gl) return

    systemRef.current.mouseUniform.value.set(mousePos.current.x, mousePos.current.y)

    const renderer = gl as any
    renderer.computeAsync?.(systemRef.current.computeUpdateNode)
  })

  if (!systemRef.current) return null

  const system = systemRef.current

  return (
    <sprite count={COUNT}>
      {/* @ts-ignore */}
      <spriteNodeMaterial
        positionNode={system.positionNode}
        colorNode={system.colorNode}
        scaleNode={system.scaleNode}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  )
}
