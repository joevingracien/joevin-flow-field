import React, { useRef, useEffect, useMemo, useCallback } from 'react'
import './RenderMaterial'
import './SimulationMaterial'
import { getDataTexture } from './getDataTexture'
import { createPortal } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFBO } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'

const SIZE = 512

export function Particles() {
  const photoTexture = useLoader(TextureLoader, '/img/photospaceme.webp')

  const particles = useMemo(() => {
    const p = new Float32Array(SIZE * SIZE * 3)
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        const k = i * SIZE + j
        p[k * 3 + 0] = (5 * i) / SIZE
        p[k * 3 + 1] = (5 * j) / SIZE
        p[k * 3 + 2] = 0
      }
    }
    return p
  }, [])

  const ref = useMemo(() => {
    const r = new Float32Array(SIZE * SIZE * 2)
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        const k = i * SIZE + j
        r[k * 2 + 0] = i / (SIZE - 1)
        r[k * 2 + 1] = j / (SIZE - 1)
      }
    }
    return r
  }, [])

  const scene = useMemo(() => new THREE.Scene(), [])
  const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1), [])

  const [target0, target1] = useMemo(
    () => [
      useFBO(SIZE, SIZE, {
        magFilter: THREE.NearestFilter,
        minFilter: THREE.NearestFilter,
        type: THREE.FloatType,
      }),
      useFBO(SIZE, SIZE, {
        magFilter: THREE.NearestFilter,
        minFilter: THREE.NearestFilter,
        type: THREE.FloatType,
      }),
    ],
    [],
  )

  const simMat = useRef()
  const renderMat = useRef()
  const followMouse = useRef()

  const { viewport, size } = useThree()

  const originalPosition = useMemo(() => getDataTexture(SIZE), [])

  const mouse = useRef(new THREE.Vector2(0, 0))
  const isTouch = useRef(false)
  const isTouchActive = useRef(false)

  const updateMousePosition = useCallback(
    (clientX, clientY) => {
      mouse.current.x = (clientX / size.width) * 2 - 1
      mouse.current.y = -(clientY / size.height) * 2 + 1
    },
    [size],
  )

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isTouch.current) {
        updateMousePosition(event.clientX, event.clientY)
      }
    }

    const handleTouchMove = (event) => {
      if (isTouchActive.current) {
        updateMousePosition(event.touches[0].clientX, event.touches[0].clientY)
      }
    }

    const handleTouchStart = (event) => {
      isTouch.current = true
      isTouchActive.current = true
      updateMousePosition(event.touches[0].clientX, event.touches[0].clientY)
    }

    const handleTouchEnd = () => {
      isTouchActive.current = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [updateMousePosition])

  useFrame(() => {
    if (followMouse.current && (!isTouch.current || isTouchActive.current)) {
      const mouseX = (mouse.current.x * viewport.width) / 2
      const mouseY = (mouse.current.y * viewport.height) / 2

      followMouse.current.position.x = mouseX
      followMouse.current.position.y = mouseY

      simMat.current.uniforms.uMouse.value.set(mouseX, mouseY)
    }
  })

  useFrame(({ gl }) => {
    gl.setRenderTarget(target0)
    gl.render(scene, camera)
    gl.setRenderTarget(null)

    renderMat.current.uniforms.uPosition.value = target1.texture
    simMat.current.uniforms.uPosition.value = target0.texture

    // Swap render targets
    const temp = target0
    target0 = target1
    target1 = temp
  })

  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[2, 2]} />
          <simulationMaterial
            ref={simMat}
            uPosition={originalPosition}
            uOriginalPosition={originalPosition}
            uPhotoTexture={photoTexture}
          />
        </mesh>,
        scene,
      )}
      <mesh ref={followMouse} position={[-2, 1.5, 0]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach='attributes-position' count={particles.length / 3} array={particles} itemSize={3} />
          <bufferAttribute attach='attributes-ref' count={ref.length / 2} array={ref} itemSize={2} />
        </bufferGeometry>
        <renderMaterial transparent={true} blending={THREE.AdditiveBlending} ref={renderMat} uTexture={photoTexture} />
      </points>
    </>
  )
}
