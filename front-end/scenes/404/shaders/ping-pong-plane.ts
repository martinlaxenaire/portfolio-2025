export const pingPongPlaneFs = /* wgsl */ `
struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@fragment fn main(fsInput: VSOutput) -> @location(0) vec4f {
    var uv: vec2f = fsInput.uv;

    // convert to -1 -> 1
    uv = uv * 2.0 - 1.0;
    // spread over X axis
    uv.x = uv.x * 0.925 + (0.0375 * pow(uv.x, 2.0) * 2.0 * sign(uv.x));
    // make smoke rise
    uv.y += params.spreadUp * 0.75 + fsInput.uv.y * params.spreadUp * 0.25;
    // convert back to 0 -> 1
    uv = uv * 0.5 + 0.5;

    var previousSample: vec4f = textureSample(renderTexture, clampSampler, uv) * params.dissipation;

    let velocityFactor: f32 = saturate(length(params.velocity));

    var mouseUvPos: vec2f = params.mousePosition;
    mouseUvPos.y = -mouseUvPos.y;
    mouseUvPos = mouseUvPos * 0.5 + 0.5;

    var cursor: vec2f = fsInput.uv - mouseUvPos;
    cursor.x *= params.resolution.x / params.resolution.y;
    cursor *= params.size;

    var color: vec4f = vec4(vec3(1.0 - length(cursor)), 1.0);

    let attenuation: f32 = smoothstep(1.0, 0.0, length(cursor)) * params.alpha * velocityFactor;
    let density = params.density * (1.0 - velocityFactor);

    color = vec4(color.rgb + previousSample.rgb * density, color.a);
    color = vec4(mix(previousSample.rgb, color.rgb * (0.75 + density * 0.25), vec3(attenuation)), color.a);

    return color;
}
`;
