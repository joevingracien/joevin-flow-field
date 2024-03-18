'use client'

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import ParticlesComponent from '@/components/canvas/ParticlesComponent'
import View from '@/components/canvas/View'

const Home = () => {
  return (
    <div className='m-auto h-screen'>
      <View className='h-full w-full'>
        <ParticlesComponent />
      </View>
    </div>
  )
}

export default Home
