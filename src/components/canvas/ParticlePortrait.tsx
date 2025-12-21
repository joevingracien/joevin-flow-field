'use client'

import { useRef, useEffect } from 'react'
import { ParticleImage } from './ParticleImage'

interface ParticlePortraitProps {
  imageSrc: string
  resolution?: number
}

export const ParticlePortrait = ({ imageSrc, resolution = 200 }: ParticlePortraitProps) => {
  const mousePosition = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current.x = e.clientX / window.innerWidth
      mousePosition.current.y = 1 - e.clientY / window.innerHeight // Flip Y for WebGL
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <ParticleImage
      imageSrc={imageSrc}
      resolution={resolution}
      particleScale={0.003}
      particleOpacity={1}
      mousePosition={mousePosition}
      mouseRepulsionRadius={0.5}
      mouseRepulsionStrength={0.015}
      returnSpeed={0.0005}
    />
  )
}
