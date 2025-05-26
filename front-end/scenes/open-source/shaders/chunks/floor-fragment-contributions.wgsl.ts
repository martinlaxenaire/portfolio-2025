export const floorAdditionalHeadContribution = /* wgsl */ `
// 2D Random
fn random2 (st: vec2f) -> f32 {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))* 43758.5453123);
}

fn myPattern(uv: vec2f) -> vec2f {
    var uv2 = uv;
    uv2.y = uv2.y + 1.0 * (random2(uv));
    return uv2 - uv;
}
`;

export const floorPreliminaryContribution = /* wgsl */ `
var reflectionUv = fragmentPosition.xy * params.reflectionQuality / vec2f(textureDimensions(reflectionTexture));
reflectionUv.y = 1.0 - reflectionUv.y;

reflectionUv = reflectionUv * 2.0 - 1.0;
reflectionUv *= 0.975;
reflectionUv = reflectionUv * 0.5 + 0.5;

var p = reflectionUv;
for (var i: i32 = 0; i < 10; i ++) {
    p -= myPattern(p) * params.frostedIntensity;
}

// Sample the reflection texture
var reflectionSample = textureSample(reflectionTexture, reflectionSampler, p);

let cosTheta = saturate(dot(normal, viewDirection));

// Compute F0 based on metallic
let F0 = vec3(0.04);
//let F0 = mix(vec3(0.04), outputColor.rgb, metallic);

// Schlick fresnel's
let H = normalize(viewDirection + normal);
let VdotH = saturate(dot(viewDirection, H));
let F90 = 1.0;
let fresnelFactor = F_Schlick(F0, F90, VdotH);

// Reduce reflections for rough surfaces
let reflectionStrength = 1.0; // Adjust reflection intensity
//let reflectionStrength = 1.0 - roughness * roughness; // Adjust reflection intensity

reflectionSample = mix(reflectionSample, vec4(0.0, 0.0, 0.0, reflectionSample.a), vec4(fresnelFactor * reflectionStrength, 1.0));

outputColor = mix(outputColor, reflectionSample, reflectionSample.a * params.reflectionStrength);
`;
