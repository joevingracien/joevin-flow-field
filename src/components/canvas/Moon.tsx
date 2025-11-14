import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export default function Moon() {
  const moonRef = useRef<THREE.Mesh>(null)
  const moonTexture = useTexture('/img/moon.webp')

  useFrame(({ clock }) => {
    if (!moonRef.current) return
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
