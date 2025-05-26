import { curlParticlesHelpers } from "./chunks/curl-particles-helpers.wgsl";
import { discardParticle } from "./chunks/discard-particle.wgsl";
import { transformedParticlePosition } from "./chunks/transformed-particle-position.wgsl";

export const shadowedParticles = /* wgsl */ `
struct DepthVSOutput {
    @builtin(position) position: vec4f,
    @location(0) data: vec4f,
};

${curlParticlesHelpers}

@vertex fn shadowMapVertex(
    attributes: Attributes,
) -> DepthVSOutput {    
    var depthVsOutput: DepthVSOutput;
    
    // get our directional light & shadow
    let directionalShadow: DirectionalShadowsElement = directionalShadows.directionalShadowsElements[0];

    var position: vec3f = attributes.position;
    var particlePosition: vec4f = attributes.particlePosition;
    var particleVelocity: vec4f = attributes.particleVelocity;
    var particleData: vec4f = attributes.particleData;
    
    ${transformedParticlePosition}
    
    let modelPosition = matrices.model * vec4(particlePosition.xyz + transformedPosition, 1.0);
    
    // no normal bias
    depthVsOutput.position = directionalShadow.projectionMatrix * directionalShadow.viewMatrix * modelPosition;
    depthVsOutput.data = particleData;
    
    return depthVsOutput;
}

@fragment fn shadowMapFragment(fsInput: DepthVSOutput) -> @location(0) vec4f {
    let data: vec4f = fsInput.data;

    ${discardParticle}
    
    // we could return anything here actually
    return vec4f(1.0);
}
`;
