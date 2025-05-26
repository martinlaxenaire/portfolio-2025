export const pingPongPlaneFs = /* wgsl */ `
struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@fragment fn main(fsInput: VSOutput) -> @location(0) vec4f {
  var uv: vec2f = fsInput.uv;
  
  // convert our mouse position from vertex coords to uv coords
  // thanks to the built-in 'getVertex2DToUVCoords' function
  var mousePosition: vec2f = getVertex2DToUVCoords(flowmap.mousePosition);

  var color: vec4f = textureSample(renderTexture, defaultSampler, uv) * flowmap.dissipation;

  var cursor: vec2f = fsInput.uv - mousePosition;
  cursor.x = cursor.x * flowmap.aspect;

  //var cursorSize: f32 = smoothstep(flowmap.cursorSize, 0.0, length(cursor)) * flowmap.alpha;
  var cursorSize: f32 = select(0.0, smoothstep(flowmap.cursorSize, 0.0, length(cursor)) * flowmap.alpha, flowmap.isActive == 1);

  color = vec4(vec3(mix(color.rgb, vec3(1.0), saturate(cursorSize))), color.a);

  return color;
}`;
