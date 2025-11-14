import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshBasicNodeMaterial, PointsNodeMaterial } from 'three/webgpu'
import {
  texture,
  uniform,
  vec2,
  vec3,
  vec4,
  Fn,
  float,
  length,
  normalize,
  If,
  attribute,
  uv,
} from 'three/tsl'
import { useFBO, useTexture } from '@react-three/drei'

/**
 * TSL-based particle system using NodeMaterial
 * Complete rewrite from scratch
 */
export function ParticleSimulation() {
  const SIZE = 512
  const COUNT = SIZE * SIZE

  // Load photo texture
  const photoTexture = useTexture('/img/photospaceme.webp')

  // Create FBOs for GPGPU simulation
  const target0 = useFBO(SIZE, SIZE, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
  })

  const target1 = useFBO(SIZE, SIZE, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
  })

  // Initial position data texture
  const initialPositionTexture = useMemo(() => {
    const data = new Float32Array(COUNT * 4)
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        const index = i * SIZE + j
        // xy = position, zw = velocity
        data[index * 4 + 0] = (i / SIZE - 0.5) * 6
        data[index * 4 + 1] = (j / SIZE - 0.5) * 6
        data[index * 4 + 2] = 0 // velocity x
        data[index * 4 + 3] = 0 // velocity y
      }
    }
    const tex = new THREE.DataTexture(
      data,
      SIZE,
      SIZE,
      THREE.RGBAFormat,
      THREE.FloatType
    )
    tex.needsUpdate = true
    return tex
  }, [SIZE, COUNT])

  // Particle geometry data
  const { positions, uvRefs } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const uvRefs = new Float32Array(COUNT * 2)

    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        const index = i * SIZE + j
        positions[index * 3 + 0] = 0
        positions[index * 3 + 1] = 0
        positions[index * 3 + 2] = 0
        uvRefs[index * 2 + 0] = i / (SIZE - 1)
        uvRefs[index * 2 + 1] = j / (SIZE - 1)
      }
    }

    return { positions, uvRefs }
  }, [SIZE, COUNT])

  const { gl, viewport, size } = useThree()
  const simSceneRef = useRef<THREE.Scene>(null!)
  const simCameraRef = useRef<THREE.OrthographicCamera>(null!)
  const simMaterialRef = useRef<MeshBasicNodeMaterial>(null!)
  const renderMaterialRef = useRef<PointsNodeMaterial>(null!)

  const mouseUniform = useRef(vec3(-10, -10, 0))
  const positionTextureNode = useRef(texture(initialPositionTexture))
  const originalPositionTextureNode = useRef(texture(initialPositionTexture))

  const targetsRef = useRef({ read: target1, write: target0 })
  const mousePos = useRef(new THREE.Vector2(0, 0))

  // Initialize simulation scene
  useEffect(() => {
    if (!simSceneRef.current) {
      simSceneRef.current = new THREE.Scene()
      simCameraRef.current = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    }

    // Initialize FBOs with starting positions
    gl.setRenderTarget(target0)
    gl.clear()
    gl.setRenderTarget(target1)
    gl.clear()
    gl.setRenderTarget(null)
  }, [gl, target0, target1])

  // TSL Simulation material
  useEffect(() => {
    if (!simMaterialRef.current) {
      // Create TSL fragment shader for particle physics
      const simulationShader = Fn(() => {
        const uv_coords = uv()
        const currentState = positionTextureNode.current.uv(uv_coords)
        const originalState = originalPositionTextureNode.current.uv(uv_coords)

        const position = currentState.xy
        const velocity = currentState.zw.mul(0.99) // damping
        const original = originalState.xy

        const mouse = mouseUniform.current

        // Attraction force to original position
        const toOriginal = original.sub(position)
        const distToOriginal = length(toOriginal)
        const attractionForce = vec2(0, 0)

        If(distToOriginal.greaterThan(float(0.01)), () => {
          const dir = normalize(toOriginal)
          attractionForce.assign(dir.mul(0.0001))
        })

        const newVelocity = velocity.add(attractionForce)

        // Mouse repulsion
        const toMouse = position.sub(mouse.xy)
        const mouseDistance = length(toMouse)
        const maxDistance = float(0.4)
        const mouseForce = vec2(0, 0)

        If(mouseDistance.lessThan(maxDistance), () => {
          const mouseDir = normalize(toMouse)
          const strength = float(1.0).sub(mouseDistance.div(maxDistance)).mul(0.01)
          mouseForce.assign(mouseDir.mul(strength))
        })

        const finalVelocity = newVelocity.add(mouseForce)
        const finalPosition = position.add(finalVelocity)

        return vec4(finalPosition.x, finalPosition.y, finalVelocity.x, finalVelocity.y)
      })()

      const material = new MeshBasicNodeMaterial()
      material.colorNode = simulationShader
      simMaterialRef.current = material
    }
  }, [])

  // TSL Render material for particles
  useEffect(() => {
    if (!renderMaterialRef.current) {
      const refAttribute = attribute('ref', 'vec2')

      // Vertex shader in TSL
      const photoTextureNode = texture(photoTexture)

      const vertexShader = Fn(() => {
        const ref = refAttribute
        const posData = positionTextureNode.current.uv(ref)
        return vec4(posData.xyz, float(1.0))
      })()

      // Fragment shader in TSL
      const fragmentShader = Fn(() => {
        const ref = refAttribute
        const uvCoords = vec2(ref.y, ref.x)
        const color = photoTextureNode.uv(uvCoords)
        return color
      })()

      const material = new PointsNodeMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      material.positionNode = vertexShader
      material.colorNode = fragmentShader
      material.sizeNode = float(1.5)

      renderMaterialRef.current = material
    }
  }, [photoTexture])

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / size.width) * 2 - 1
      mousePos.current.y = -(e.clientY / size.height) * 2 + 1
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mousePos.current.x = (e.touches[0].clientX / size.width) * 2 - 1
        mousePos.current.y = -(e.touches[0].clientY / size.height) * 2 + 1
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [size])

  // Update mouse uniform
  useFrame(() => {
    const mx = (mousePos.current.x * viewport.width) / 2
    const my = (mousePos.current.y * viewport.height) / 2
    // Mouse uniform is a TSL node, we'll update it via the material uniforms
  })

  // GPGPU simulation loop
  useFrame(() => {
    if (!simSceneRef.current || !simMaterialRef.current || !renderMaterialRef.current) return

    const { read, write } = targetsRef.current

    // Update texture nodes to use current read texture
    positionTextureNode.current = texture(read.texture)

    // Render simulation to write target
    gl.setRenderTarget(write)
    gl.render(simSceneRef.current, simCameraRef.current)
    gl.setRenderTarget(null)

    // Swap buffers
    targetsRef.current = { read: write, write: read }
  })

  if (!simSceneRef.current) return null

  return (
    <>
      {/* Simulation mesh (off-screen) */}
      {simMaterialRef.current && (
        <mesh ref={(mesh) => {
          if (mesh && simSceneRef.current && !simSceneRef.current.children.length) {
            simSceneRef.current.add(mesh)
          }
        }}>
          <planeGeometry args={[2, 2]} />
          <primitive object={simMaterialRef.current} attach="material" />
        </mesh>
      )}

      {/* Render particles */}
      {renderMaterialRef.current && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
              count={COUNT}
            />
            <bufferAttribute
              attach="attributes-ref"
              args={[uvRefs, 2]}
              count={COUNT}
            />
          </bufferGeometry>
          <primitive object={renderMaterialRef.current} attach="material" />
        </points>
      )}
    </>
  )
}
