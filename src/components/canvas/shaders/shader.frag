uniform sampler2D pictureTexture;

void main() {
  vec3 pictureColor = texture2D(pictureTexture, gl_PointCoord).rgb;
  gl_FragColor = vec4(pictureColor, 1.0);
}