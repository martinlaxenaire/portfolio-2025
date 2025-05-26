export const titlePlaneVs = /* wgsl */ `
struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
  @location(2) worldPosition: vec3f,
  @location(3) viewDirection: vec3f,
};

@vertex fn main(
  attributes: Attributes,
) -> VSOutput {
  var vsOutput: VSOutput;
  
  var position: vec3f = attributes.position;
  var normal: vec3f = attributes.normal;
  
  // curve
  let angle: f32 = 1.0 / curve.nbItems;
  
  let PI = ${Math.PI};
  
  let cosAngle = cos(position.x * PI * angle);
  let sinAngle = sin(position.x * PI * angle);
        
  position.z = cosAngle * curve.itemWidth;
  position.x = sinAngle;
  
  normal.z = attributes.normal.x * sinAngle + attributes.normal.z * cosAngle;
  normal.x = attributes.normal.x * cosAngle - attributes.normal.z * sinAngle;

  vsOutput.position = getOutputPosition(position);
  vsOutput.normal = getWorldNormal(normalize(normal));
  
  vsOutput.uv = attributes.uv;
  
  let worldPosition: vec4f = getWorldPosition(position);
  vsOutput.worldPosition = worldPosition.xyz / worldPosition.w;
  vsOutput.viewDirection = camera.position - vsOutput.worldPosition;
  
  return vsOutput;
}
`;

export const titlePlaneFs = /* wgsl */ `
struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
  @location(2) worldPosition: vec3f,
  @location(3) viewDirection: vec3f,
};

@fragment fn main(
  fsInput: VSOutput,
) -> @location(0) vec4f {
  var color: vec4f = textureSample(planeTexture, anisotropicSampler, fsInput.uv);
  
  if(color.a < 0.1) {
    discard;
  }

  //return vec4(vec3(normalize(fsInput.normal) * 0.5 + 0.5), 1.0);
  return color;
}
`;

export const mediaPlaneVs = /* wgsl */ `
struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
  @location(2) worldPosition: vec3f,
  @location(3) viewDirection: vec3f,
};

@vertex fn main(
  attributes: Attributes,
) -> VSOutput {
  var vsOutput: VSOutput;
  
  var position: vec3f = attributes.position;
  var normal: vec3f = attributes.normal;

  vsOutput.position = getOutputPosition(position);
  vsOutput.normal = getWorldNormal(normalize(normal));
  
  vsOutput.uv = getUVCover(attributes.uv, texturesMatrices.planeTexture.matrix);
  
  let worldPosition: vec4f = getWorldPosition(position);
  vsOutput.worldPosition = worldPosition.xyz / worldPosition.w;
  vsOutput.viewDirection = camera.position - vsOutput.worldPosition;
  
  return vsOutput;
}
`;

export const mediaPlaneFs = /* wgsl */ `
struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
  @location(2) worldPosition: vec3f,
  @location(3) viewDirection: vec3f,
};

@fragment fn main(
  fsInput: VSOutput,
) -> @location(0) vec4f {
  var color: vec4f = textureSample(planeTexture, defaultSampler, fsInput.uv);
  return color;
}
`;

export const mediaExternalPlaneFs = /* wgsl */ `
struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
  @location(2) worldPosition: vec3f,
  @location(3) viewDirection: vec3f,
};

@fragment fn main(
  fsInput: VSOutput,
) -> @location(0) vec4f {
  var color: vec4f = textureSampleBaseClampToEdge(planeTexture, defaultSampler, fsInput.uv);
  return color;
}
`;

export const mediaPlanesShaderPassFs = /* wgsl */ `
struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@fragment fn main(fsInput: VSOutput) -> @location(0) vec4f {
  var uv: vec2f = fsInput.uv;
  
  // convert to [-1, 1]
  uv = uv * 2.0 - 1.0;

  // apply deformation
  let uvDeformation: f32 = 1.0 - cos(abs(uv.x) * 3.141592 * 0.5);
  
  // apply deformation uniforms
  //uv.y *= 1.0 - deformation.maxStrength * uvDeformation * sign(uv.x);
  uv.y *= 1.0 - deformation.maxStrength * uvDeformation;
  
  // convert back to [0, 1]
  uv = uv * 0.5 + 0.5;

  let color: vec4f = textureSample(renderTexture, clampSampler, uv);
  let background: vec4f = textureSample(backgroundTexture, clampSampler, uv);

  return mix(background, color, color.a);
}
`;
