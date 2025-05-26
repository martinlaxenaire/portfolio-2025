// cheaper volumetric pass:
// https://github.com/alienkitty/alien.js/blob/main/src/shaders/VolumetricLightShader.js
export const volumetricLightingPass = /* wgsl */ `
fn pow2(x: f32) -> f32 {
    return x * x;
}

fn pow4(x: f32) -> f32 {
    let x2 = x * x;
    return x2 * x2;
}

fn rangeAttenuation(range: f32, distance: f32, decay: f32) -> f32 {
    var distanceFalloff = 1.0 / max(pow(distance, decay), 0.01);
    if (range > 0.0) {
        distanceFalloff *= pow2(saturate(1.0 - pow4(distance / range)));
    }
    return distanceFalloff;
}

fn linearizeDepth(rawDepth: f32, near: f32, far: f32) -> f32 {
    return near * far / (far - rawDepth * (far - near));
}

fn reconstructWorldPosition(
    uv: vec2f,
    linearDepth: f32,
    frustumSize: vec2f,
    cameraFar: f32,
    cameraPosition: vec3f
) -> vec3f {
    var negatedUv = vec2(uv.x, 1.0 - uv.y);
    // since getVisibleSizeAtDepth already multiplies result by 2, we need uv in [-0.5, 0.5] range
    negatedUv -= 0.5;

    // Convert UV to screen-space offset
    // account for vertical field of view
    let offset = negatedUv * frustumSize * camera.tanFov;

    // Reconstruct camera ray at far plane and scale by depth
    let ray = vec3(offset, -cameraFar);
    let scaledRay = ray * (linearDepth / cameraFar);

    return cameraPosition + scaledRay;
}

fn beersLaw(dist: f32, absorption: f32) -> f32 {
    return exp(-dist * absorption);
}

struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

@fragment fn main(fsInput: VSOutput) -> @location(0) vec4<f32> {
    let pointShadow: PointShadowsElement = pointShadows.pointShadowsElements[0];
    let pointLight = pointLights.elements[0];

    // Sample depth
    let rawDepth = textureLoad(depthTexture, vec2<i32>(fsInput.position.xy / params.qualityRatio), 0);

    // Normally we'd do
    // Reconstruct view-space position
    // let ndc = vec4(
    //     fsInput.uv.x * 2.0 - 1.0,
    //     (1.0 - fsInput.uv.y) * 2.0 - 1.0, // negate Y axis
    //     rawDepth,
    //     1.0
    // );

    // let viewPos = params.inverseProjectionMatrix * ndc;
    // let viewPosNDC = viewPos.xyz / viewPos.w;

    // Transform to world space
    //let worldPos = (params.inverseViewMatrix * vec4(viewPosNDC, 1.0)).xyz;

    // But we're gonna reconstruct world position with linearized depth and camera infos
    // Thanks Douglas Lilliequist for the idea!

    // Linearize depth (WebGPU [0..1] depth range)
    let linearDepth = linearizeDepth(rawDepth, camera.near, camera.far);

    // Reconstruct world position
    let worldPos = reconstructWorldPosition(
        fsInput.uv,
        linearDepth,
        camera.frustumSize,
        camera.far,
        camera.position
    );
    

    // === Volumetric lighting ===

    let numSteps = params.nbSteps;
    var accumulated = 0.0;
    var totalTransmittance = 1.0;

    // let ray = worldPos - camera.position;
    // let rayLength = length(ray);
    // let stepSize = rayLength / f32(numSteps);
    // let rayDir = normalize(ray);
    let fullRay = worldPos - camera.position;
    let rayDir = normalize(fullRay);
    let rayStart = camera.position + rayDir * camera.near;
    let ray = worldPos - rayStart;
    let rayLength = length(ray);
    let stepSize = rayLength / f32(numSteps);

    // blue noise
    let blueNoiseDimensions = vec2f(textureDimensions(blueNoiseTexture));
    let blueNoiseSample = textureSample(blueNoiseTexture, defaultSampler, fsInput.position.xy / blueNoiseDimensions).r;
    let offset = fract(blueNoiseSample + (params.frames % 32) / sqrt(0.5));

    for (var i = 0u; i <= numSteps; i++) {
        if(totalTransmittance < 0.01) {
            continue;
        }

        let step = f32(i) / f32(numSteps);
        let t = step * rayLength * offset;

        if(t < camera.near || t > camera.far) {
            continue;
        }

        let samplePos = rayStart + rayDir * t;

        let lightDistance = length(pointLight.position - samplePos);

        let attenuation = rangeAttenuation(pointLight.range, lightDistance, 2.0);

        if (attenuation < 1e-6) {
            continue;
        }

        let lightDir = normalize(pointLight.position - samplePos);
        var lightRange = max(pointLight.range, 0.00001);

        let referenceDepth = lightDistance / lightRange;

        let visibility = textureSampleCompareLevel(
            pointShadowCubeDepthTexture0,
            depthComparisonSampler,
            lightDir,
            referenceDepth - pointShadow.bias
        );

        let occlusion = select(0.0, 1.0, lightDistance <= visibility * lightRange);

        if(occlusion < 0.001) {
            continue;
        }

        // Henyey-Greenstein approximation or basic phase
        let phase = max(dot(lightDir, rayDir), 0.0);

        //let density = pow(params.density, (1.0 + step));
        let density = params.density;

        // let transmittance = beersLaw(stepSize, density);
        // let accumulation: f32 = attenuation * phase * stepSize * occlusion * totalTransmittance;
        // totalTransmittance *= transmittance;

        let accumulation: f32 = attenuation * phase * stepSize * occlusion * density;

        accumulated += accumulation;
    }

    return vec4(accumulated * params.lightColor, accumulated);
}
`;
