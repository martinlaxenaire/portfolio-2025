export const heroPlaneFs = /* wgsl */ `
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

fn roundedRectSDF(uv: vec2f, resolution: vec2f, radiusPx: f32) -> f32 {
    let aspect = resolution.x / resolution.y;

    // Convert pixel values to normalized UV space
    let marginUV = vec2f(radiusPx) / resolution;
    let radiusUV = vec2f(radiusPx) / resolution;

    // Adjust radius X for aspect ratio
    let radius = vec2f(radiusUV.x * aspect, radiusUV.y);

    // Center UV around (0,0) and apply scale (progress)
    var p = uv * 2.0 - 1.0;       // [0,1] → [-1,1]
    p.x *= aspect;                // fix aspect
    p /= max(0.0001, params.showProgress); // apply scaling
    p = abs(p);

    // Half size of the rounded rect
    let halfSize = vec2f(1.0) - marginUV * 2.0 - radiusUV * 2.0;
    let halfSizeScaled = vec2f(halfSize.x * aspect, halfSize.y);

    let d = p - halfSizeScaled;
    let outside = max(d, vec2f(0.0));
    let dist = length(outside) + min(max(d.x, d.y), 0.0) - radius.x * 2.0;

    return dist;
}
  
@fragment fn main(fsInput: VSOutput) -> @location(0) vec4f {
  let uv: vec2f = fsInput.uv;
  
  // Compute aspect ratio correction
  let aspect = params.resolution.x / params.resolution.y;

  // Center UVs at (0.5, 0.5)
  var centeredUV = uv - vec2f(0.5);

  // Compute radial distance from center
  let radialDist = length(centeredUV) * 2.0; // Scale to range [0, 2]

  centeredUV.x *= aspect; // Scale x to match y

  // Compute Concentric Expanding Circles Effect
  let numCircles = 4.0; // Number of circles
  let waveSpeed = params.speed * 10.0; // Speed of expansion
  let wave = sin(radialDist * numCircles - params.time * waveSpeed);

  // Map wave from [-1,1] to [0,1]
  var concentricCircles = 0.5 + 0.5 * wave;
  concentricCircles = smoothstep(1.1, 0.1, concentricCircles);

  let computedNoise = noise(centeredUV * params.noiseScale + params.time * params.speed * 2.0);

  // **🔹 Apply Noise-Based UV Distortion**
  var noiseOffset = vec2<f32>(
    computedNoise - 0.5,
    computedNoise - 0.5
  ) * params.noiseStrength;

  noiseOffset = mix(noiseOffset, vec2(0.0), vec2(concentricCircles));
  
  centeredUV += noiseOffset; // Apply noise to UVs

  // Apply rotation using a 2D rotation matrix
  let angleOffset = params.time * params.speed; // Rotation angle in radians
  let cosA = cos(angleOffset);
  let sinA = sin(angleOffset);
  
  // Rotate the centered UVs
  centeredUV = vec2<f32>(
      cosA * centeredUV.x - sinA * centeredUV.y,
      sinA * centeredUV.x + cosA * centeredUV.y
  );

  // Convert to polar coordinates
  let angle = atan2(centeredUV.y, centeredUV.x); // Angle in radians
  let radius = length(centeredUV);

  // Map angle to triangle index
  let totalSegments  = params.numTriangles * f32(params.nbColors) * params.fillColorRatio;
  let normalizedAngle = (angle + ${Math.PI}) / (2.0 * ${Math.PI}); // Normalize to [0,1]
  let triIndex = floor(normalizedAngle * totalSegments); // Get triangle index

  // Compute fractional part for blending
  let segmentFraction = fract(normalizedAngle * totalSegments); // Value in [0,1] within segment

  let isEmpty = (i32(triIndex) % i32(params.fillColorRatio)) == i32(params.fillColorRatio - 1.0);
  let colorIndex = i32(triIndex / params.fillColorRatio) % params.nbColors; // Use half as many color indices

  let alpha: f32 = smoothstep(0.25, 0.75, params.showProgress);
  let color = select(vec4(params.colors[colorIndex] * alpha, alpha), vec4f(0.0), isEmpty);

  // rounded corners
  var roundedUv = uv * 2.0 - 1.0;
  // apply noise
  roundedUv *= (1.0 + computedNoise * 0.015) + (1.0 - params.showProgress) * computedNoise * 0.225;
  roundedUv = roundedUv * 0.5 + 0.5;

  let sdf = roundedRectSDF(roundedUv, params.resolution, params.borderRadius);
  let roundedRectMask = smoothstep(0.0, 0.005, -sdf); // fade near edge

  //let centerFade = smoothstep(0.25, 0.375, radialDist); // Darkens toward center
  let centerFade = smoothstep(0.1 * params.showProgress, 0.1 + 0.4 * params.showProgress, radialDist); // Darkens toward center

  // **🔹 Apply Noise to Edge Fade**
  let radialShade = centerFade * roundedRectMask;

  //return vec4(vec3(roundedRectMask), 1.0);
  return color * radialShade;
}
`;
