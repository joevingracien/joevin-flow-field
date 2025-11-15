import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect, useCallback } from 'react'
import type { NormalizedMousePosition } from '@/components/canvas/FlowField.types'

/**
 * useNormalizedMouse
 *
 * Efficiently tracks mouse position in normalized coordinates (0 to 1).
 * Uses smooth interpolation for organic movement in GPU compute shaders.
 *
 * @param smoothFactor - Lerp interpolation factor (0-1). Lower = smoother. Default: 0.1
 * @returns MutableRefObject with { x, y } normalized position (0-1 range)
 *
 * @example
 * ```tsx
 * const mousePos = useNormalizedMouse(0.1)
 * // Access via mousePos.current.x and mousePos.current.y
 * ```
 */
export const useNormalizedMouse = (smoothFactor: number = 0.1) => {
  const { size } = useThree()
  const targetPosition = useRef<NormalizedMousePosition>({ x: 0.5, y: 0.5 })
  const currentPosition = useRef<NormalizedMousePosition>({ x: 0.5, y: 0.5 })

  // Memoize event handler to avoid recreating on every render
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      // Convert to normalized coordinates (0 to 1)
      const x = event.clientX / size.width
      const y = 1 - event.clientY / size.height // Flip Y axis for WebGL coordinate system

      targetPosition.current.x = x
      targetPosition.current.y = y
    },
    [size.width, size.height]
  )

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove])

  // Smooth lerping in the render loop for organic movement
  useFrame(() => {
    const { current: target } = targetPosition
    const { current: current } = currentPosition

    current.x += (target.x - current.x) * smoothFactor
    current.y += (target.y - current.y) * smoothFactor
  })

  return currentPosition
}
