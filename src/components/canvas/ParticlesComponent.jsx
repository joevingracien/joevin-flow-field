import React, { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture, useCursor } from '@react-three/drei'
import particlesVertexShader from './shaders/shader.vert'
import particlesFragmentShader from './shaders/shader.frag'

const ParticlesComponent = () => {
  const { size, camera } = useThree()
  const aspect = size.width / size.height

  const pictureTexture = useTexture('/img/meparticles.png')
  const glowTexture = useTexture('/img/glow.png')

  const displacement = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')
    context.fillRect(0, 0, canvas.width, canvas.height)
    return {
      canvas,
      context,
      texture: new THREE.CanvasTexture(canvas),
    }
  }, [])

  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(10, 10, 256, 256)
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(geometry.attributes.uv.array, 2))

    const intensitiesArray = new Float32Array(geometry.attributes.position.count)
    const anglesArray = new Float32Array(geometry.attributes.position.count)

    for (let i = 0; i < geometry.attributes.position.count; i++) {
      intensitiesArray[i] = Math.random()
      anglesArray[i] = Math.random() * Math.PI * 2
    }

    geometry.setAttribute('aIntensity', new THREE.Float32BufferAttribute(intensitiesArray, 1))
    geometry.setAttribute('aAngle', new THREE.Float32BufferAttribute(anglesArray, 1))

    return geometry
  }, [])

  const particlesMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(size.width * aspect, size.height * aspect) },
        uPictureTexture: { value: pictureTexture },
        uDisplacementTexture: { value: displacement.texture },
      },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })
  }, [size, aspect, pictureTexture, displacement.texture])

  const interactivePlaneRef = useRef()
  const raycaster = useRef(new THREE.Raycaster())
  const screenCursor = useRef(new THREE.Vector2(9999, 9999))
  const canvasCursor = useRef(new THREE.Vector2(9999, 9999))
  const canvasCursorPrevious = useRef(new THREE.Vector2(9999, 9999))

  const onPointerMove = (event) => {
    screenCursor.current.x = (event.clientX / size.width) * 2 - 1
    screenCursor.current.y = -(event.clientY / size.height) * 2 + 1
  }

  useFrame(() => {
    raycaster.current.setFromCamera(screenCursor.current, camera)
    const intersects = raycaster.current.intersectObject(interactivePlaneRef.current)

    if (intersects.length) {
      const uv = intersects[0].uv
      canvasCursor.current.x = uv.x * displacement.canvas.width
      canvasCursor.current.y = (1 - uv.y) * displacement.canvas.height
    }

    // Fade out
    displacement.context.globalCompositeOperation = 'source-over'
    displacement.context.globalAlpha = 0.02
    displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height)

    // Speed alpha
    const cursorDistance = canvasCursorPrevious.current.distanceTo(canvasCursor.current)
    canvasCursorPrevious.current.copy(canvasCursor.current)
    const alpha = Math.min(cursorDistance * 0.05, 1)

    // Draw glow
    const glowSize = displacement.canvas.width * 0.25
    displacement.context.globalCompositeOperation = 'lighten'
    displacement.context.globalAlpha = alpha
    displacement.context.drawImage(
      glowTexture.image,
      canvasCursor.current.x - glowSize * 0.5,
      canvasCursor.current.y - glowSize * 0.5,
      glowSize,
      glowSize,
    )

    displacement.texture.needsUpdate = true
  })

  return (
    <>
      <points geometry={particlesGeometry} material={particlesMaterial} onPointerMove={onPointerMove} />
      <mesh ref={interactivePlaneRef} visible={false}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

export default ParticlesComponent
