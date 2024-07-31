'use client'

import React from 'react'
import { Particles } from '@/components/canvas/Particles'
import View from '@/components/canvas/View'
import Moon from '@/components/canvas/Moon'
import Common from '@/components/canvas/Common'
import Image from 'next/image'
import Link from 'next/link'
import { Canvas } from '@react-three/fiber'

const Home = () => {
  return (
    <>
      <header className='my-10 flex h-14 w-full justify-between'>
        <View className='z-10 w-14'>
          <Common controls />
          <Moon />
        </View>
        <div className='z-40 my-auto flex gap-4'>
          <p>hello@joevingracien.com</p>
          <Link href='https://x.com/JoevinGracien' target='_blank'>
            <Image src='/icons/xlogo.svg' width={20} height={20} />
          </Link>
        </div>
      </header>
      <section className='flex h-[90vh]'>
        <div className=' -mt-32 flex max-w-[25rem] flex-col justify-center gap-6'>
          <h1 className='z-30 font-sans text-3xl font-bold text-white'>Elevating web experiences</h1>
          <p className='z-30 '>
            Greetings from the digital space! <br /> I'm Joevin, your partner in propelling user-centered websites to
            new heights.
          </p>
          <ul className='font-semiboldz-30 mt-6 flex gap-4 text-sm'>
            <li className=' text-white'>Strategy</li>
            <li className=' text-white'>Design</li>
            <li className='  text-white'>Development</li>
          </ul>
        </div>
        <Canvas className='absolute left-0 top-0 h-[110vh] w-[130vw]'>
          <Particles />
        </Canvas>
      </section>
    </>
  )
}

export default Home
