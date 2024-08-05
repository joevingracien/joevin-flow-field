import React, { useRef, useMemo } from 'react'
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

export function Particles() {
  const { viewport, gl } = useThree()
  const dpr = gl.getPixelRatio()

  const SIZE = useMemo(() => Math.floor(512 * Math.max(1, dpr)), [dpr])
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
  }, [SIZE])

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
  }, [SIZE])

  const scene = useMemo(() => new THREE.Scene(), [])
  const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1), [])

  const renderTargets = useRef([
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
  ])

  const simMat = useRef()
  const renderMat = useRef()

  const originalPosition = useMemo(() => getDataTexture(SIZE), [SIZE])

  useFrame(({ mouse, gl }) => {
    const mouseX = (mouse.x * viewport.width) / 2
    const mouseY = (mouse.y * viewport.height) / 2

    if (simMat.current) {
      simMat.current.uniforms.uMouse.value.x = mouseX
      simMat.current.uniforms.uMouse.value.y = mouseY
    }

    gl.setRenderTarget(renderTargets.current[0])
    gl.render(scene, camera)
    gl.setRenderTarget(null)

    if (renderMat.current && simMat.current) {
      renderMat.current.uniforms.uPosition.value = renderTargets.current[1].texture
      simMat.current.uniforms.uPosition.value = renderTargets.current[0].texture
    }

    // Swap render targets
    renderTargets.current.reverse()
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
      <points>
        <bufferGeometry>
          <bufferAttribute attach='attributes-position' count={particles.length / 3} array={particles} itemSize={3} />
          <bufferAttribute attach='attributes-ref' count={ref.length / 2} array={ref} itemSize={2} />
        </bufferGeometry>
        <renderMaterial
          transparent={true}
          blending={THREE.AdditiveBlending}
          ref={renderMat}
          uTexture={photoTexture}
          uPointSize={1 / dpr} // Adjust point size based on DPR
        />
      </points>
    </>
  )
}
