import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const Moon = () => {
  const moonRef = useRef()
  const moonTexture = useTexture('/img/moon.webp')

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime()
    moonRef.current.rotation.y = elapsedTime * 0.1
  })

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={4} />
      <mesh ref={moonRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial map={moonTexture} />
      </mesh>
    </>
  )
}

export default Moon
