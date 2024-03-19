import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const RenderMaterial = shaderMaterial(
  {
    uPosition: null,
    uTexture: null,
  },
  // vertex shader
  `
  attribute vec2 ref;
  varying vec2 vRef;
  uniform sampler2D uPosition;
  void main() {
    vRef = ref;
    vec3 pos = texture2D(uPosition, ref).rgb;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 1.0;
  }
  `,
  // fragment shader
  `
  varying vec2 vRef;
  uniform sampler2D uTexture;
  void main() {
    vec2 uv = vec2( vRef.y, vRef.x);
    vec4 textureColor = texture2D(uTexture, uv);
    gl_FragColor.rgba = textureColor;
  }
  `,
)

extend({ RenderMaterial })
