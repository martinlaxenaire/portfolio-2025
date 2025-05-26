export const mainSphereGlowVs = /* wgsl */ `
struct VSOutput {
    @builtin(position) position: vec4f,
    @location(1) glowIntensity: f32,
};

@vertex fn main(
    attributes: Attributes,
  ) -> VSOutput {
    var vsOutput: VSOutput;
    
    var position: vec3f = attributes.position;
    var normal: vec3f = attributes.normal;
  
    vsOutput.position = getOutputPosition(position);
    normal = getWorldNormal(normalize(normal));
    
    let mvPosition: vec3f = normalize((camera.view * matrices.model * vec4( position, 1.0 )).xyz);
    vsOutput.glowIntensity = pow( 0.05 - dot(normal, mvPosition), params.glowPower );
    
    return vsOutput;
}
`;

export const mainSphereGlowFs = /* wgsl */ `
struct VSOutput {
    @builtin(position) position: vec4f,
    @location(1) glowIntensity: f32,
};

  
@fragment fn main(
fsInput: VSOutput,
) -> @location(0) vec4f {
    var color: vec4f = vec4(params.color * fsInput.glowIntensity, fsInput.glowIntensity);
    return color;
}
`;
