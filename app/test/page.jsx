'use client'

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import ParticlesComponent from '@/components/canvas/ParticlesComponent'
import View from '@/components/canvas/View'

const Home = () => {
  return (
    <div className='h-screen'>
      <View className='h-full w-full'>
        <color attach='background' args={['#181818']} />
        <OrbitControls enableDamping />
        <ParticlesComponent scale={0.2} />
      </View>
    </div>
  )
}

export default Home
