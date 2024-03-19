uniform sampler2D positionTexture;

void main() {
  vec3 pos = texture2D(positionTexture, uv).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 2.0;
}