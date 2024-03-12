'use client'

import { Heart } from '@/components/canvas/Heart'
import { Loading } from '@/components/dom/Loading'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'
import SplitText from 'gsap/dist/SplitText'
import dynamic from 'next/dynamic'

const Torus = dynamic(() => import('@/components/canvas/Torus'), { ssr: false })

const View = dynamic(() => import('@/components/canvas/View'), { ssr: false, loading: Loading })

if (typeof window !== 'undefined') {
  gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP)
}

export default function Page() {
  useGSAP(() => {
    const split = new SplitText('.ta', { type: 'chars' }) // Splitting the text into characters
    gsap.from(split.chars, {
      duration: 0.5,
      opacity: 0,
      y: -20,
      rotationX: 180,
      transformOrigin: '0% 90% -10',
      stagger: 0.02,
      ease: 'expo.out',
    })
    gsap.to('.trigger', {
      scrollTrigger: {
        trigger: '.trigger',
        start: 'top 70% ',
        end: 'bottom 30%',
        scrub: 1,
        pin: true,
      },
      x: 500,
      duration: 3,
    })
  }, []) // <<

  return (
    <main>
      <nav className='p-6 font-sans text-2xl'>Joevin Gracien</nav>
      <div className='flex h-[90dvh] flex-col items-center justify-center'>
        <h1 className='ta font-mono text-7xl font-black'>
          UX Lover
          <span className='mt-2 block text-center text-xl font-normal tracking-widest'>bringing the web to life</span>
        </h1>
        <div className='flex p-10'>
          <p className='heart m-auto mr-5 text-xl'>Design + Code =</p>
          <View className='heart size-10'>
            <ambientLight intensity={1.5} />
            <Heart className='heart' />
          </View>
        </div>
      </div>
      {/*   <div className='flex h-[90dvh] flex-row content-between items-center justify-center'>
        <div className='trigger w-full bg-red-600 text-center'>yo</div>
        <div className='heartdiv w-full text-center'>hola</div>
      </div>
      <div className='flex h-[90dvh] flex-row content-between items-center justify-center'>
        <div className='trigger2 w-full text-center'>yo</div>
        <div className='heartdiv w-full text-center'>hola</div>
      </div> */}
    </main>
  )
}
