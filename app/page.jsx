'use client'

import dynamic from 'next/dynamic'
import { Loading } from '@/components/dom/Loading'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import SplitText from 'gsap/dist/SplitText'

const Torus = dynamic(() => import('@/components/canvas/Torus'), { ssr: false })

const View = dynamic(() => import('@/components/canvas/View'), { ssr: false, loading: Loading })

if (typeof window !== 'undefined') {
  gsap.registerPlugin(SplitText, useGSAP)
}

export default function Page() {
  useGSAP(() => {
    // gsap code here...
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
  }, []) // <
  return (
    <main>
      <nav className='p-6 font-mono text-2xl'>Joevin Gracien</nav>
      <div className='flex h-[90dvh] flex-col items-center justify-center'>
        <h1 className='ta font-sans text-7xl'>
          UX Lover
          <span className='mt-2 block text-center text-xl tracking-widest'>bringing the web to life</span>
        </h1>
        <div className='p-10'>Design + Code = ❤️</div>
      </div>
    </main>
  )
}
/*         <View className='size-80'>
          <Torus />
        </View> */
