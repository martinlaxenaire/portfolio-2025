export const pixelPassFs = /* wgsl */ `
struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

@fragment
fn main(fsInput: VSOutput) -> @location(0) vec4f {
  let sceneSample = textureSample(renderTexture, clampSampler, fsInput.uv);

  // sample flowmap result with our min pixelated resolution
  let flowmaPixelSize: vec2f = 1.0 / (params.resolution * params.minPixelSize);
  let flowmapPixelatedUV = saturate(floor(fsInput.uv / flowmaPixelSize) * flowmaPixelSize);

  let flowmapSample = textureSample(flowMapTexture, defaultSampler, flowmapPixelatedUV);
  let flowmapValue = flowmapSample.r;

  // determine pixel size based on flowmap intensity
  var pixelFlowmapValue = 1.0 - smoothstep(params.minPixelSize, 1.0, flowmapValue);

  var pixelSizeFromFlowmap = floor(pixelFlowmapValue * (1.0 / params.minPixelSize)) * params.minPixelSize;
  pixelSizeFromFlowmap = clamp(pixelSizeFromFlowmap, params.minPixelSize, 1.0);

  let pixelSize: vec2f = 1.0 / (params.resolution * pixelSizeFromFlowmap);

  // sample scene with resulting pixelated resolution
  let pixelatedUV = saturate(floor(fsInput.uv / pixelSize) * pixelSize);
  let pixelatedSample = textureSample(renderTexture, clampSampler, pixelatedUV);

  // debug
  return mix(sceneSample, pixelatedSample, step(params.minPixelSize, flowmapValue));
}`;
