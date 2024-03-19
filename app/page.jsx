'use client'

import React from 'react'
import { Particles } from '@/components/canvas/Particles'
import View from '@/components/canvas/View'
import { Canvas } from '@react-three/fiber'

const Home = () => {
  return (
    <div className='m-auto h-screen'>
      <Canvas>
        <Particles />
      </Canvas>
    </div>
  )
}

export default Home
