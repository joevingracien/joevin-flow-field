'use client'
import React, { useRef } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(Flip, ScrollTrigger)

const FlipScrollDemo = () => {
  const container = useRef()
  const section1 = useRef()
  const section2 = useRef()
  const section3 = useRef()
  const image = useRef()

  useGSAP(
    () => {
      let flipState

      // Set initial image position in section1
      section1.current.appendChild(image.current)

      // Create the ScrollTrigger animation
      ScrollTrigger.create({
        trigger: container.current,
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          if (self.progress < 0.33) {
            // Flip from section1 to section2
            if (image.current.parentNode !== section1.current) {
              flipState = Flip.getState(image.current)
              section1.current.appendChild(image.current)
              Flip.from(flipState, {
                duration: 1,
                scale: true,
                absolute: true,
                ease: 'power1.inOut',
              })
            }
          } else if (self.progress < 0.66) {
            // Flip from section2 to section3
            if (image.current.parentNode !== section2.current) {
              flipState = Flip.getState(image.current)
              section2.current.appendChild(image.current)
              Flip.from(flipState, {
                duration: 1,
                scale: true,
                absolute: true,
                ease: 'power1.inOut',
              })
            }
          } else {
            // Flip to final position in section3
            if (image.current.parentNode !== section3.current) {
              flipState = Flip.getState(image.current)
              section3.current.appendChild(image.current)
              Flip.from(flipState, {
                duration: 1,
                scale: true,
                absolute: true,
                ease: 'power1.inOut',
              })
            }
          }
        },
      })
    },
    { scope: container },
  )

  return (
    <div ref={container}>
      <section className='h-80' ref={section1}>
        <h2>Section 1</h2>
      </section>
      <section className='ml-72 h-80' ref={section2}>
        <h2>Section 2</h2>
      </section>
      <section className='h-80' ref={section3}>
        <h2>Section 3</h2>
      </section>
      <div ref={image} className='size-40 bg-red-500' />
    </div>
  )
}

export default FlipScrollDemo
