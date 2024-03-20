'use client'

import React from 'react'
import { Particles } from '@/components/canvas/Particles'
import View from '@/components/canvas/View'
import { Canvas } from '@react-three/fiber'

const Home = () => {
  return (
    <div className='m-auto flex h-screen'>
      <View className='size-full'>
        <Particles />
      </View>
    </div>
  )
}

export default Home
