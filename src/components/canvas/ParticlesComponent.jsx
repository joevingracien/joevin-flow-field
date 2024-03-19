import React, { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { useTexture, useFBO, shaderMaterial } from '@react-three/drei'
import particlesVertexShader from './shaders/shader.vert'
import particlesFragmentShader from './shaders/shader.frag'
import simulationVertexShader from './shaders/simshader.vert'
import simulationFragmentShader from './shaders/simshader.frag'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'

const SimulationMaterial = {
  uniforms: {
    uPosition: { value: null },
    uOriginalPosition: { value: null },
    uMouse: { value: new THREE.Vector3(-10, -10, 10) },
  },
  vertexShader: simulationVertexShader,
  fragmentShader: simulationFragmentShader,
}

const ParticlesMaterial = {
  uniforms: {
    uPosition: { value: null },
    uResolution: { value: new THREE.Vector2() },
    uPictureTexture: { value: null },
    uDisplacementTexture: { value: null },
  },
  vertexShader: particlesVertexShader,
  fragmentShader: particlesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
}

const ParticlesComponent = () => {
  const { size, gl, pointer } = useThree()
  const aspect = size.width / size.height

  const pictureTexture = useTexture('/img/meparticles.png')
  const glowTexture = useTexture('/img/glow.png')

  const count = 512 * 512
  const gpuCompute = useMemo(() => new GPUComputationRenderer(512, 512, gl), [gl])

  const positionVariable = useMemo(
    () => gpuCompute.addVariable('uCurrentPosition', simulationFragmentShader, getDataTexture(512)),
    [gpuCompute],
  )
  const velocityVariable = useMemo(
    () => gpuCompute.addVariable('uCurrentVelocity', simulationFragmentShader, getVelocityTexture(512)),
    [gpuCompute],
  )

  useMemo(() => {
    gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable])
    gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable])

    const positionUniforms = positionVariable.material.uniforms
    const velocityUniforms = velocityVariable.material.uniforms

    velocityUniforms.uMouse = { value: new THREE.Vector3(0, 0, 0) }
    positionUniforms.uOriginalPosition = { value: getDataTexture(512) }
    velocityUniforms.uOriginalPosition = { value: getDataTexture(512) }

    gpuCompute.init()
  }, [gpuCompute, positionVariable, velocityVariable])

  const simulationFBO = useFBO(512, 512, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  })

  const simulationScene = useMemo(() => {
    const scene = new THREE.Scene()
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial(SimulationMaterial))
    scene.add(mesh)
    return scene
  }, [])

  const interactivePlaneRef = useRef()
  const raycaster = useRef(new THREE.Raycaster())
  const screenCursor = useRef(new THREE.Vector2(9999, 9999))
  const canvasCursor = useRef(new THREE.Vector2(9999, 9999))
  const canvasCursorPrevious = useRef(new THREE.Vector2(9999, 9999))

  const onPointerMove = (event) => {
    screenCursor.current.x = (event.clientX / size.width) * 2 - 1
    screenCursor.current.y = -(event.clientY / size.height) * 2 + 1
  }

  useFrame(({ clock, camera }) => {
    gpuCompute.compute()

    simulationScene.children[0].material.uniforms.uPosition.value =
      gpuCompute.getCurrentRenderTarget(positionVariable).texture
    simulationScene.children[0].material.uniforms.uOriginalPosition.value =
      positionVariable.material.uniforms.uOriginalPosition.value
    simulationScene.children[0].material.uniforms.uMouse.value.set(
      (pointer.x * size.width) / 2,
      (pointer.y * size.height) / 2,
      0,
    )

    ParticlesMaterial.uniforms.uPosition.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture

    raycaster.current.setFromCamera(screenCursor.current, camera)
    const intersects = raycaster.current.intersectObject(interactivePlaneRef.current)

    if (intersects.length) {
      const uv = intersects[0].uv
      canvasCursor.current.x = uv.x * size.width
      canvasCursor.current.y = (1 - uv.y) * size.height
    }

    // Fade out
    const displacementCanvas = document.createElement('canvas')
    displacementCanvas.width = size.width
    displacementCanvas.height = size.height
    const displacementContext = displacementCanvas.getContext('2d')
    displacementContext.globalCompositeOperation = 'source-over'
    displacementContext.globalAlpha = 0.02
    displacementContext.fillRect(0, 0, size.width, size.height)

    // Speed alpha
    const cursorDistance = canvasCursorPrevious.current.distanceTo(canvasCursor.current)
    canvasCursorPrevious.current.copy(canvasCursor.current)
    const alpha = Math.min(cursorDistance * 0.05, 1)

    // Draw glow
    const glowSize = size.width * 0.25
    displacementContext.globalCompositeOperation = 'lighten'
    displacementContext.globalAlpha = alpha
    displacementContext.drawImage(
      glowTexture.image,
      canvasCursor.current.x - glowSize * 0.5,
      canvasCursor.current.y - glowSize * 0.5,
      glowSize,
      glowSize,
    )

    const displacementTexture = new THREE.CanvasTexture(displacementCanvas)
    ParticlesMaterial.uniforms.uDisplacementTexture.value = displacementTexture

    gl.setRenderTarget(simulationFBO)
    gl.clear()
    gl.render(simulationScene, camera)
    gl.setRenderTarget(null)
  })

  return (
    <>
      <points onPointerMove={onPointerMove}>
        <bufferGeometry>
          <bufferAttribute
            attachObject={['attributes', 'position']}
            count={count}
            array={new Float32Array(count * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          uniforms={ParticlesMaterial.uniforms}
          vertexShader={ParticlesMaterial.vertexShader}
          fragmentShader={ParticlesMaterial.fragmentShader}
          transparent={ParticlesMaterial.transparent}
          blending={ParticlesMaterial.blending}
          depthWrite={ParticlesMaterial.depthWrite}
        />
      </points>
      <mesh ref={interactivePlaneRef} visible={false}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

function getDataTexture(size) {
  const data = new Float32Array(size * size * 4)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const index = i * size + j
      data[index * 4] = (i / size) * 2 - 1
      data[index * 4 + 1] = (j / size) * 2 - 1
      data[index * 4 + 2] = 0
      data[index * 4 + 3] = 1
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType)
  texture.needsUpdate = true
  return texture
}

function getVelocityTexture(size) {
  const data = new Float32Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 0
    data[i * 4 + 1] = 0
    data[i * 4 + 2] = 0
    data[i * 4 + 3] = 1
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType)
  texture.needsUpdate = true
  return texture
}

export default ParticlesComponent
