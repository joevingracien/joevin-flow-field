'use client'

import React from 'react'
import { Particles } from '@/components/canvas/Particles'
import View from '@/components/canvas/View'

const Home = () => {
  return (
    <div className='m-auto h-screen'>
      <View className='h-full w-full'>
        <Particles />
      </View>
    </div>
  )
}

export default Home
