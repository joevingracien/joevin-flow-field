'use client'
import React, { useRef } from 'react'
import { Particles } from '@/components/canvas/Particles'
import View from '@/components/canvas/View'
import Moon from '@/components/canvas/Moon'
import Common from '@/components/canvas/Common'
import Image from 'next/image'
import Link from 'next/link'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const Home = () => {
  const moonRef = useRef()
  const particlesRef = useRef()
  const headingRef = useRef()
  const paragraphRef = useRef()
  const listRef = useRef()

  useGSAP(() => {
    const tl = gsap.timeline()

    if (moonRef.current) {
      tl.from(moonRef.current, { scale: 30, duration: 2, ease: 'power2.in' })
    }

    tl.from(headingRef.current, { opacity: 0, y: 50, duration: 1 }, '-=0.5')
      .from(paragraphRef.current, { opacity: 0, y: 30, duration: 1 }, '-=0.5')
      .from(
        listRef.current.children,
        {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: 0.2,
        },
        '-=0.5',
      )
  }, [])

  return (
    <>
      <header className='my-5 flex h-14 w-full justify-between lg:my-10'>
        <View ref={moonRef} className='z-10 w-14'>
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
          <h1 ref={headingRef} className='font-sans text-3xl font-bold text-white'>
            Elevating web experiences
          </h1>
          <p ref={paragraphRef} className=''>
            Greetings from the digital space! <br /> I'm Joevin, your partner in propelling user-centered websites to
            new heights.
          </p>
          <ul ref={listRef} className='mt-3 flex gap-4 text-sm font-semibold lg:mt-6'>
            <li className='text-white'>Strategy</li>
            <li className='text-white'>Design</li>
            <li className='text-white'>Development</li>
          </ul>
        </div>
        <div className='pointer-events-none fixed -left-40 bottom-0 z-20 h-[100vh] w-[230vw] bg-gradient-to-b from-transparent to-black/90 lg:hidden'></div>
        <View ref={particlesRef} className='fixed left-0 top-0 h-[110vh] w-[130vw]'>
          <Particles />
        </View>
      </section>
    </>
  )
}

export default Home
