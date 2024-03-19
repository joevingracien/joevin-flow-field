uniform sampler2D positions;
uniform sampler2D uvs;

void main() {
  vec2 uv = texture2D(uvs, position.xy).xy;
  vec3 pos = texture2D(positions, uv).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}