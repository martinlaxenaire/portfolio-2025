export const blurPassFs = /* wgsl */ `
struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

fn radialBlur(
    uv: vec2<f32>,
    center: vec2<f32>,
    texture: texture_2d<f32>,
    sampler: sampler
) -> vec4<f32> {
    var sum = vec4<f32>(0.0);
    let samples = params.blurSamples;

    for (var i:u32 = 0; i < samples; i++) {
        let t = f32(i) / f32(samples - 1);
        let offset = normalize(uv - center) * t * params.blurStrength / params.resolution;
        sum += textureSample(texture, sampler, uv - offset);
    }

    return sum / f32(samples);
}

fn applyDithering(color: vec4f, fragCoord: vec2f) -> vec4f {
    // Simple random noise based on fragment coordinates
    let scale = 1.0 / params.noiseScale; // Adjust this value to control the strength of the dithering
    let noise = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);

    // Apply the noise to the color
    return vec4(color.rgb + vec3(noise * scale), color.a);
}

@fragment fn main(fsInput: VSOutput) -> @location(0) vec4<f32> {
let lightScreenUv = params.lightScreenUv;

var blurredVolumetric = radialBlur(fsInput.uv, lightScreenUv, volumetricTargetTexture, defaultSampler);
//blurredVolumetric = applyDithering(blurredVolumetric, fsInput.position.xy * params.resolution);
blurredVolumetric = applyDithering(blurredVolumetric, fsInput.position.xy);

let sceneSample = textureSample(renderTexture, defaultSampler, fsInput.uv);
//let mixValue = smoothstep(0.15, 1.0, blurredVolumetric.a);
//let mixValue = pow(blurredVolumetric.a, 1.15);
let mixValue = blurredVolumetric.a;

// let volumetricSample = textureSample(volumetricTargetTexture, defaultSampler, fsInput.uv);
// return mix(vec4(volumetricSample.rgb, mixValue), blurredVolumetric, step(fsInput.uv.x, 0.5));

return select(mix(sceneSample, blurredVolumetric, mixValue), blurredVolumetric, params.debugView > 0.0);
}
`;

export const bicubicSamplePassFs = /* wgsl */ `
fn w0(a: f32) -> f32 {
    return (1.0/6.0)*(a*(a*(-a + 3.0) - 3.0) + 1.0);
}

fn w1(a: f32) -> f32 {
    return (1.0/6.0)*(a*a*(3.0*a - 6.0) + 4.0);
}

fn w2(a: f32) -> f32 {
    return (1.0/6.0)*(a*(a*(-3.0*a + 3.0) + 3.0) + 1.0);
}

fn w3(a: f32) -> f32 {
    return (1.0/6.0)*(a*a*a);
}

// g0 and g1 are the two amplitude functions
fn g0(a: f32) -> f32 {
    return w0(a) + w1(a);
}

fn g1(a: f32) -> f32 {
    return w2(a) + w3(a);
}

// h0 and h1 are the two offset functions
fn h0(a: f32) -> f32 {
    return -1.0 + w1(a) / (w0(a) + w1(a));
}

fn h1(a: f32) -> f32 {
    return 1.0 + w3(a) / (w2(a) + w3(a));
}

fn texture_bicubic(tex: texture_2d<f32>, inputUv: vec2f, texelSize: vec4f, fullSize: vec2f, lod: f32) -> vec4f {
	var uv: vec2f = inputUv * texelSize.zw + 0.5;
	let iuv: vec2f = floor( uv );
	let fuv: vec2f = fract( uv );

    let g0x: f32 = g0(fuv.x);
    let g1x: f32 = g1(fuv.x);
    let h0x: f32 = h0(fuv.x);
    let h1x: f32= h1(fuv.x);
    let h0y: f32 = h0(fuv.y);
    let h1y: f32 = h1(fuv.y);

	let p0: vec2f = (vec2(iuv.x + h0x, iuv.y + h0y) - 0.5) * texelSize.xy;
	let p1: vec2f = (vec2(iuv.x + h1x, iuv.y + h0y) - 0.5) * texelSize.xy;
	let p2: vec2f = (vec2(iuv.x + h0x, iuv.y + h1y) - 0.5) * texelSize.xy;
	let p3: vec2f = (vec2(iuv.x + h1x, iuv.y + h1y) - 0.5) * texelSize.xy;
	
    let lodFudge: vec2f = pow(1.95, lod) / fullSize;
    return g0(fuv.y) * (g0x * 
        textureSampleLevel(tex, defaultSampler, p0, lod)  +
                        
        g1x * textureSampleLevel(tex, defaultSampler, p1, lod)
                    ) +
           g1(fuv.y) * (
            g0x * textureSampleLevel(tex, defaultSampler, p2, lod)  +
                        g1x * textureSampleLevel(tex, defaultSampler, p3, lod));
}


fn textureBicubic(s: texture_2d<f32>, uv: vec2f, lod: f32) -> vec4f  {
    let lodSizeFloor: vec2f = vec2f(textureDimensions(s, i32(round(lod))));
    let lodSizeCeil: vec2f = vec2f(textureDimensions(s, i32(round(lod) + 1.0)));
    let fullSize: vec2f = vec2f(textureDimensions(s, 0));

    let floorSample: vec4f = texture_bicubic(
        s,
        uv,
        vec4(1.0 / lodSizeFloor.x, 1.0 / lodSizeFloor.y, lodSizeFloor.x, lodSizeFloor.y),
        fullSize,
        floor(lod)
    );

    let ceilSample: vec4f = texture_bicubic(
        s,
        uv,
        vec4(1.0 / lodSizeCeil.x, 1.0 / lodSizeCeil.y, lodSizeCeil.x, lodSizeCeil.y),
        fullSize,
        ceil(lod)
    );

    return mix(floorSample, ceilSample, fract(lod));
}


//
// Cubic interpolation using Catmull-Rom spline
fn cubicInterpolate(p0: f32, p1: f32, p2: f32, p3: f32, t: f32) -> f32 {
    let a = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
    let b = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3;
    let c = -0.5 * p0 + 0.5 * p2;
    let d = p1;
    return ((a * t + b) * t + c) * t + d;
}

fn cubicInterpolateVec4(p0: vec4f, p1: vec4f, p2: vec4f, p3: vec4f, t: f32) -> vec4f {
    return vec4f(
        cubicInterpolate(p0.x, p1.x, p2.x, p3.x, t),
        cubicInterpolate(p0.y, p1.y, p2.y, p3.y, t),
        cubicInterpolate(p0.z, p1.z, p2.z, p3.z, t),
        cubicInterpolate(p0.w, p1.w, p2.w, p3.w, t)
    );
}

fn cubicWeight(t: f32) -> f32 {
    let a = -0.5; // Catmull-Rom spline
    let absT = abs(t);
    if absT < 1.0 {
        return ((a + 2.0) * absT - (a + 3.0)) * absT * absT + 1.0;
    } else if absT < 2.0 {
        return (((absT - 5.0) * absT + 8.0) * absT - 4.0) * a;
    }
    return 0.0;
}

fn bicubicSample(tex: texture_2d<f32>, uv: vec2f, texelSize: vec2f) -> vec4f {
    let coord = uv / texelSize - 0.5;
    let base = floor(coord);
    let f = coord - base;

    var color = vec4f(0.0);
    var totalWeight = 0.0;

    for (var j = -1; j <= 2; j++) {
        for (var i = -1; i <= 2; i++) {
            let offset = vec2f(f32(i), f32(j));
            let sampleUv = (base + offset + 0.5) * texelSize;
            let w = cubicWeight(offset.x - f.x) * cubicWeight(offset.y - f.y);
            color += textureSample(tex, linearSampler, sampleUv) * w;
            totalWeight += w;
        }
    }

    return color / totalWeight;
}
//


struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

@fragment fn main(fsInput: VSOutput) -> @location(0) vec4f {
    let sceneSample = textureSample(renderTexture, defaultSampler, fsInput.uv);

    let volumetricTextureSize = vec2f(textureDimensions(volumetricTargetTexture));
    let sceneTextureSize = vec2f(textureDimensions(renderTexture));

    
    let texelSize = 1.0 / vec2f(textureDimensions(volumetricTargetTexture));
    //let volumetricSample: vec4f = bicubicSample(volumetricTargetTexture, fsInput.uv, texelSize);
    let volumetricSample: vec4f = textureBicubic(volumetricTargetTexture, fsInput.uv, 1.0 + sceneTextureSize.x / volumetricTextureSize.x);
    //let volumetricSample = textureSample(volumetricTargetTexture, defaultSampler, fsInput.uv);

    // let texSize = vec2f(textureDimensions(volumetricTargetTexture, 0));
    // let uv = fsInput.uv * texSize - 0.5;
    // let base = vec2i(floor(uv));
    // let f = fract(uv);

    // var sampleRows: array<vec4f, 4>;

    // for (var j = 0; j < 4; j++) {
    //     var row: array<vec4f, 4>;
    //     for (var i = 0; i < 4; i++) {
    //         let offset = vec2i(i - 1, j - 1);
    //         let coord = base + offset;
    //         row[i] = textureLoad(volumetricTargetTexture, coord, 0);
    //     }
    //     sampleRows[j] = cubicInterpolateVec4(row[0], row[1], row[2], row[3], f.x);
    // }

    // let volumetricSample = cubicInterpolateVec4(
    //     sampleRows[0], sampleRows[1], sampleRows[2], sampleRows[3], f.y
    // );


    //return select(mix(sceneSample, volumetricSample, mixValue), volumetricSample, params.debugView > 0.0);
    return select(sceneSample + volumetricSample * 1.0, volumetricSample, params.debugView > 0.0);
    //return sceneSample + volumetricSample * 2.0;
}
`;

export const blendPassFs = /* wgsl */ `
struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

@fragment fn main(fsInput: VSOutput) -> @location(0) vec4f {
    let sceneSample = textureSample(renderTexture, defaultSampler, fsInput.uv);

    let volumetricSample = textureSample(blurTexture, defaultSampler, fsInput.uv);
    //return sceneSample + volumetricSample;
    return select(sceneSample + volumetricSample * 1.0, volumetricSample, params.debugView > 0.0);
}
`;

export const blueNoiseCompute = /* wgsl */ `
// A very basic Poisson-disc like distribution generator
// This won't give perfect blue noise, but approximates it by spacing out samples
// Intended for a 2D noise texture generation in a compute shader

// Adjust this to your desired output texture size
let textureSize = vec2u(128, 128);
let maxSamples = 512u;

@group(0) @binding(0) var<storage, write> noiseTexture : array<f32>;

fn hash2D(coord: vec2u) -> f32 {
    var x = f32(coord.x);
    var y = f32(coord.y);
    return fract(sin(dot(vec2(x, y), vec2(12.9898, 78.233))) * 43758.5453);
}

// Simple spatial rejection sampling to avoid clusters
fn isTooClose(pos: vec2u, radius: u32, texSize: vec2u) -> bool {
    let r = i32(radius);
    for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
            let nx = i32(pos.x) + dx;
            let ny = i32(pos.y) + dy;
            if (nx < 0 || ny < 0 || nx >= i32(texSize.x) || ny >= i32(texSize.y)) {
                continue;
            }
            let index = u32(ny) * texSize.x + u32(nx);
            if (noiseTexture[index] > 0.0) {
                let dist = length(vec2<f32>(f32(dx), f32(dy)));
                if (dist < f32(radius)) {
                    return true;
                }
            }
        }
    }
    return false;
}

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let seed = id.x;
    var count = 0u;
    loop {
        if (count >= maxSamples) {
            break;
        }

        let x = u32(floor(hash2D(vec2u(seed, count)) * f32(textureSize.x)));
        let y = u32(floor(hash2D(vec2u(count, seed)) * f32(textureSize.y)));
        let pos = vec2u(x, y);
        let index = y * textureSize.x + x;

        if (!isTooClose(pos, 4u, textureSize)) {
            noiseTexture[index] = 1.0; // or use count/f32(maxSamples) for gray intensity
            count += 1u;
        }
    }
}

`;

export const gaussianBlurPassFs = /* wgsl */ `
struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

@fragment
fn main(fsInput: VSOutput) -> @location(0) vec4f {
    //let textureSize = vec2f(textureDimensions(volumetricTargetTexture));
    let textureSize = params.resolution;
    let texelSize: vec2f = 1.0 / textureSize;

    var color = vec4f(0.0);
    var totalWeight = 0.0;

    // let sigma: f32 = 5.0;
    // let kernelRadius = i32(ceil(sigma * 3.0));

    // for (var i = -kernelRadius; i <= kernelRadius; i++) {
    //     let offset = f32(i);
    //     let weight = exp(-0.5 * (offset / sigma) * (offset / sigma));
    //     let sampleUv = fsInput.uv + params.direction * params.radius * texelSize * offset;

    //     color += textureSample(volumetricTargetTexture, defaultSampler, sampleUv) * weight;
    //     totalWeight += weight;
    // }

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
