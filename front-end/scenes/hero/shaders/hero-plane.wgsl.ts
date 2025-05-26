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
  let numCircles = 5.0; // Number of circles
  let waveSpeed = params.speed * 15.0; // Speed of expansion
  let wave = sin(radialDist * numCircles - params.time * waveSpeed);

  // Map wave from [-1,1] to [0,1]
  var concentricCircles = 0.5 + 0.5 * wave;
  concentricCircles = smoothstep(1.0, 0.0, concentricCircles);

  let computedNoise = noise(centeredUV * params.noiseScale + params.time * params.speed * 2.0);

  // **🔹 Apply Noise-Based UV Distortion**
  var noiseOffset = vec2<f32>(
    computedNoise - 0.5,
    computedNoise - 0.5
  ) * params.noiseStrength;

  noiseOffset = mix(vec2(0.0), noiseOffset, vec2(concentricCircles));
  
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

  let color = select(vec4(params.colors[colorIndex], 1.0), vec4f(0.0), isEmpty);
  //let color = mix(vec4(params.colors[colorIndex], 1.0), vec4f(0.0), fadeAmount);

  // **🔹 Compute distance to the closest screen edge**
  var adjustedUV = uv;
  adjustedUV = adjustedUV * 2.0 - 1.0;
  adjustedUV /= (0.8 + params.showProgress * 0.2);
  adjustedUV = adjustedUV * 0.5 + 0.5;
  adjustedUV.x *= aspect; // Scale X to match aspect

  // **🔹 Compute distance to the closest screen edge (with aspect)**
  var edgeDist = min(min(adjustedUV.x, aspect - adjustedUV.x), min(adjustedUV.y, 1.0 - adjustedUV.y));
  edgeDist /= aspect; // Normalize back
  edgeDist *= params.showProgress;

  // **🔹 Generate Noise Mask for Edge Fade**
  let edgeNoise = computedNoise * 0.5 * (0.5 + params.showProgress * 0.5); // Noise in range [-1,1]

  // **🔹 Apply Step for Hard Noisy Edge Mask**
  //let edgeThreshold = smoothstep(1.0, 0.9, radialDist); // Define the edge region
  //let edgeNoisePosition = (1.0 - params.showProgress) * 0.25;
  let edgeThreshold = smoothstep(0.0, 0.05, edgeDist); // Define the edge region

  let edgeThresholdMin = 0.025; // Start of fade
  let edgeThresholdMax = 0.05; // End of fade
  let noiseMask = smoothstep(edgeThresholdMin, edgeThresholdMax, (edgeThreshold - edgeNoise)); 

  //let noiseMask = step(edgeNoise, edgeThreshold);       // Apply noise to mask

  //let centerFade = smoothstep(0.25, 0.375, radialDist); // Darkens toward center
  let centerFade = smoothstep(0.1 * params.showProgress, 0.05 + 0.45 * params.showProgress, radialDist); // Darkens toward center

  // **🔹 Apply Noise to Edge Fade**
  let radialShade = noiseMask * centerFade;

  //return vec4(vec3(concentricCircles), 1.0);
  return color * radialShade;
}
`;
