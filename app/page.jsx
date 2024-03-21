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
        <div className=' max-w- -mt-10 flex max-w-[25rem] flex-col justify-center gap-6'>
          <h1 className='font-sans text-3xl font-bold '>Elevating web experiences.</h1>
          <p className=' '>
            Greetings from the digital space! <br /> I'm Joevin, your partner in propelling user-centered websites to
            new heights. Together, let's lift beyond the ordinary!
          </p>
        </div>
        <View className='absolute left-0 top-0 h-[110vh] w-[130vw]'>
          <Particles />
        </View>
      </section>
    </>
  )
}

export default Home
