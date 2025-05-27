export const planeFs = /* wgsl */ `
struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

  // Simple hash function for noise
fn hash(p: vec2<f32>) -> f32 {
  let h = dot(p, vec2<f32>(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

// Smooth noise function
fn noise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  
  let a = hash(i);
  let b = hash(i + vec2<f32>(1.0, 0.0));
  let c = hash(i + vec2<f32>(0.0, 1.0));
  let d = hash(i + vec2<f32>(1.0, 1.0));
  
  let u = f * f * (3.0 - 2.0 * f);
  
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn interpolateColors(value: f32) -> vec3f {
    let segments = params.nbColors; // Number of color intervals
    let scaled = value * segments;
    let index = clamp(floor(scaled), 0.0, segments - 1.0);
    let t = fract(scaled); // fractional part for interpolation

    let i = u32(index);
    return mix(params.colors[i], params.colors[i + 1], t);
}

@fragment fn main(fsInput: VSOutput) -> @location(0) vec4f {
    let computedNoise = noise(fsInput.uv * params.noiseScale + params.time * params.speed * 2.0);

    var displacedCoords: vec2f = fsInput.uv;
    displacedCoords.x += sin((computedNoise - 0.5) * 0.1) * sin(params.time * params.speed) * params.noiseStrength;
    displacedCoords.y += sin((computedNoise - 0.5) * 0.1) * sin(params.time * params.speed) * params.noiseStrength;

    let pingPongSample: vec4f = textureSample(renderTexture, clampSampler, displacedCoords);

    let aspect: f32 = params.resolution.x / params.resolution.y;
    let offset: vec2f = vec2(0.025 * cos(params.time * params.speed), aspect * 0.025 * sin(params.time * params.speed));
    let ppTextOffset1 = textureSample(renderTexture, clampSampler, displacedCoords + offset);          
    let ppTextOffset2 = textureSample(renderTexture, clampSampler, displacedCoords - offset);

    // make a hole inside the effect
    let smoke: f32 = saturate(cos((ppTextOffset1.r + ppTextOffset2.r + pingPongSample.r) * ${Math.PI} + ${Math.PI}));

    let distanceToGradient = distance(fsInput.uv, vec2(fract(params.time * params.speed * 0.25)));
    let gradient: vec4f = vec4(interpolateColors(distanceToGradient), params.pointerOpacity);

    return mix(vec4(vec3(params.bgColor), 0.0), gradient, vec4(smoke));
}
`;
