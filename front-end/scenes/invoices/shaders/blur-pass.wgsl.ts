export const blendPassFs = /* wgsl */ `
struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

@fragment fn main(fsInput: VSOutput) -> @location(0) vec4f {
    let sceneSample = textureSample(renderTexture, defaultSampler, fsInput.uv);

    let volumetricSample = textureSample(blurTexture, defaultSampler, fsInput.uv);
    return select(sceneSample + volumetricSample, volumetricSample, params.debugView > 0.0);
}
`;

export const gaussianBlurPassFs = /* wgsl */ `
struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

@fragment
fn main(fsInput: VSOutput) -> @location(0) vec4f {
    let textureSize = params.resolution;
    let texelSize: vec2f = 1.0 / textureSize;

    var color = vec4f(0.0);
    var totalWeight = 0.0;

    const numSamples = 13;
        let offsets = array<i32, numSamples>(-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6);
        let weights = array<f32, numSamples>(
            0.00916, 0.01979, 0.03877, 0.07030, 0.11588,
            0.16311, 0.18367,
            0.16311, 0.11588, 0.07030, 0.03877, 0.01979, 0.00916
          );

    for (var i = 0; i <= numSamples; i++) {
        let offsetUV = fsInput.uv + params.direction * params.radius * f32(offsets[i]) * texelSize;
        color += textureSample(volumetricTargetTexture, defaultSampler, offsetUV) * weights[i];
        totalWeight += weights[i];
    }

    return color / totalWeight;
}
`;
