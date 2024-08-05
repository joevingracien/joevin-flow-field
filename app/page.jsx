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
      <header className='my-5 flex h-14 w-full justify-between lg:my-10'>
        <View className='z-10 w-14'>
          <Common controls />
          <Moon />
        </View>
        <div className='z-40 my-auto flex gap-4'>
          <p>hello@joevingracien.com</p>
          <Link href='https://x.com/JoevinGracien' target='_blank'>
            <Image src='/icons/xlogo.svg' width={20} height={20} alt='X (formely Twitter) logo' />
          </Link>
        </div>
      </header>
      <section className='flex h-[80svh] lg:h-[90vh]'>
        <div className='pointer-events-none z-30 -mt-32 flex max-w-[25rem] flex-col justify-end gap-6 md:justify-center'>
          <h1 className=' font-sans text-3xl font-bold text-white'>Elevating web experiences</h1>
          <p className=''>
            Greetings from the digital space! <br /> I'm Joevin, your partner in propelling user-centered websites to
            new heights.
          </p>
          <ul className='mt-3 flex gap-4 text-sm font-semibold lg:mt-6'>
            <li className=' text-white'>Strategy</li>
            <li className=' text-white'>Design</li>
            <li className='  text-white'>Development</li>
          </ul>
        </div>
        <div className='pointer-events-none fixed -left-40 bottom-0 z-20 h-[100vh] w-[230vw] bg-gradient-to-b from-transparent via-black/50 to-black/90 lg:hidden'></div>
        <View className='fixed left-0 top-0 h-[110vh] w-[130vw]'>
          <Particles />
        </View>
      </section>
    </>
  )
}

export default Home
