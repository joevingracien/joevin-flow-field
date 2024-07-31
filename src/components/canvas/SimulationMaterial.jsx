import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

const SimulationMaterial = shaderMaterial(
  {
    uPosition: null,
    uOriginalPosition: null,
    uMouse: new THREE.Vector3(-10, -10, 10),
    uTime: 0,
  },
  // vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 5.0;
    }
    `,
  // fragment shader
  `
    varying vec2 vUv;
    uniform sampler2D uPosition;
    uniform sampler2D uOriginalPosition;
    uniform vec3 uMouse;
    uniform float uTime;

    float easeInOutQuint(float x) {
      return x < 0.5 ? 16.0 * x * x * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 5.0) / 2.0;
    }

    void main() {
      vec2 position = texture2D(uPosition, vUv).xy;
      vec2 original = texture2D(uOriginalPosition, vUv).xy;
      vec2 velocity = texture2D(uPosition, vUv).zw;

      velocity *= 0.95;

      // Calculate target position (original position)
      vec2 targetPosition = original;

      // Non-linear acceleration factor with longer slow start
      float t = clamp(uTime * 0.2, 0.0, 1.0); // Adjust the 0.2 to control overall speed
      float accelerationFactor = easeInOutQuint(t);

      // Apply non-linear acceleration to movement towards original position
      vec2 direction = targetPosition - position;
      float distanceToTarget = length(direction);
      
      // Increase speed based on acceleration factor and distance
      float speed = mix(0.001, 0.1, accelerationFactor) * distanceToTarget;
      position += normalize(direction) * speed;

      // Mouse repel force
      float mouseDistance = distance(position, uMouse.xy);
      float maxDistance = 0.4;
      if (mouseDistance < maxDistance) {
        vec2 repelDirection = normalize(position - uMouse.xy);
        float repelStrength = (1.0 - accelerationFactor) * 0.01; // Reduce mouse influence over time
        velocity += repelDirection * (1.0 - mouseDistance / maxDistance) * repelStrength;
      }

      position.xy += velocity;

      gl_FragColor = vec4(position, velocity);
    }
    `,
)

extend({ SimulationMaterial })
