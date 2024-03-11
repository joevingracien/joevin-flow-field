import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export function Heart(props) {
  const heartref = useRef()
  useGSAP(() => {
    gsap.to(heartref.current.scale, { x: 5.6, y: 5.6, z: 5.6, ease: 'bounce', repeat: -1, yoyo: true })
  }, []) //

  const { nodes } = useGLTF('/heart.glb')

  return (
    <group {...props} dispose={null}>
      <mesh
        ref={heartref}
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={5}
        position={[0, -2.2, 0]}
      >
        <meshStandardMaterial color='red' />
      </mesh>
    </group>
  )
}

useGLTF.preload('/heart.glb')
