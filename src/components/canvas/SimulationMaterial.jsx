import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const SimulationMaterial = shaderMaterial(
  {
    uPosition: null,
    uOriginalPosition: null,
    uMouse: new THREE.Vector2(0, 0),
    uVelocityFactor: 1.0,
  },
  // vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 1.0;
    }
  `,
  // fragment shader
  `
    varying vec2 vUv;
    uniform sampler2D uPosition;
    uniform sampler2D uOriginalPosition;
    uniform vec2 uMouse;
    uniform float uVelocityFactor;
    
    void main() {
      vec2 position = texture2D(uPosition, vUv).xy;
      vec2 original = texture2D(uOriginalPosition, vUv).xy;
      vec2 velocity = texture2D(uPosition, vUv).zw;

      velocity *= 0.99;

      // particle attraction to shape force
      vec2 direction = normalize(original - position);
      float dist = length(original - position);
      if(dist > 0.01) {
        velocity += direction * 0.0001;
      }

      // mouse repel force
      float mouseDistance = distance(position, uMouse);
      float maxDistance = 0.4;
      if(mouseDistance < maxDistance) {
        vec2 direction = normalize(position - uMouse);
        velocity += direction * (1.0 - mouseDistance / maxDistance) * 0.01 * uVelocityFactor;
      }

      position += velocity * uVelocityFactor;

      gl_FragColor = vec4(position, velocity);
    }
  `,
)

extend({ SimulationMaterial })
