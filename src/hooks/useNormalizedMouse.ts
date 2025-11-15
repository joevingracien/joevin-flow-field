import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'

/**
 * useNormalizedMouse
 *
 * Tracks mouse position in normalized coordinates (0 to 1).
 * Returns a ref object that updates every frame for GPU compute shaders.
 *
 * @param {number} smoothFactor - Lerp factor for smoothing (default: 0.1)
 * @returns {React.MutableRefObject} Ref object with { x, y } normalized position (0-1 range)
 */
export const useNormalizedMouse = (smoothFactor: number = 0.1) => {
  const { size } = useThree()
  const targetPosition = useRef({ x: 0.5, y: 0.5 })
  const currentPosition = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Convert to normalized coordinates (0 to 1)
      const x = event.clientX / size.width
      const y = 1 - (event.clientY / size.height) // Flip Y axis

      targetPosition.current.x = x
      targetPosition.current.y = y
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [size])

  // Smooth lerping in the render loop
  useFrame(() => {
    currentPosition.current.x += (targetPosition.current.x - currentPosition.current.x) * smoothFactor
    currentPosition.current.y += (targetPosition.current.y - currentPosition.current.y) * smoothFactor
  })

  return currentPosition
}
