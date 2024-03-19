uniform sampler2D pictureTexture;
uniform sampler2D uGlowTexture;
uniform vec2 uGlowPosition;
uniform float uGlowSize;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pictureColor = texture2D(pictureTexture, uv).rgb;
  vec3 glowColor = texture2D(uGlowTexture, uv).rgb;

  float dist = distance(gl_FragCoord.xy, uGlowPosition);
  float glowIntensity = smoothstep(uGlowSize, 0.0, dist);

  vec3 color = pictureColor + glowColor * glowIntensity;
  gl_FragColor = vec4(color, 1.0);
}
