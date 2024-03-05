'use client'

import { Canvas } from '@react-three/fiber'
import { Preload, View } from '@react-three/drei'

export default function Scene(props) {
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <Canvas shadows {...props} eventSource={document.body} eventPrefix='client'>
      <View.Port />
      <Preload all />
    </Canvas>
  )
}
