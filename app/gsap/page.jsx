'use client'

import React, { useRef } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(Flip, ScrollTrigger)

export default function Page() {
  const container = useRef()
  const section1 = useRef()
  const section2 = useRef()
  const section3 = useRef()
  const box = useRef()
  return (
    <div ref={container} className='h-screen overflow-hidden'>
      <section ref={section1} className='flex h-80 items-center justify-center'>
        <h2 className='text-4xl'>Section 1</h2>
      </section>
      <section ref={section2} className='container ml-[10%] mt-40 size-32 border border-fuchsia-500 p-2'>
        <div className='size-28 bg-orange-500'></div>
      </section>
      <section ref={section3} className='container mb-56 ml-[90%] mt-48 size-32 border border-fuchsia-500 p-2'>
        <div className='size-28 bg-purple-500'></div>
      </section>
      <div ref={box} className='box z-10 size-28 bg-green-500'></div>
      <div className='h-screen bg-blue-500'></div>
    </div>
  )
}
