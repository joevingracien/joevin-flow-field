'use client'

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import ParticlesComponent from '@/components/canvas/ParticlesComponent'

const Home = () => {
  return (
    <Canvas camera={{ position: [0, 0, 18], fov: 35 }}>
      <color attach='background' args={['#181818']} />
      <OrbitControls enableDamping />
      <ParticlesComponent />
    </Canvas>
  )
}

export default Home
