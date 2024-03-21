'use client'

import React from 'react'
import { Particles } from '@/components/canvas/Particles'
import View from '@/components/canvas/View'
import Moon from '@/components/canvas/Moon'
import Common from '@/components/canvas/Common'

const Home = () => {
  return (
    <>
      <header className='my-10 flex h-14 w-full'>
        <View className='w-14'>
          <Common controls enableZoom />
          <Moon />
        </View>
      </header>
      <section className='flex h-[90vh]'>
        <div className='max-w- flex max-w-96 flex-col justify-center gap-6'>
          <h1 className='font-sans text-3xl text-zinc-300' style={{ fontVariationSettings: "'wdth' 100, 'wght' 1000" }}>
            Elevating web experiences.
          </h1>
          <p className='text-zinc-300'>
            Greetings from the digital space! I'm Joevin, your partner in propelling user-centered websites to new
            heights. Together, let's lift beyond the ordinary!
          </p>
        </div>
        <View className='size-screen absolute bottom-0 right-0 h-[100vh] w-[100vw]'>
          <Particles />
        </View>
      </section>
    </>
  )
}

export default Home
