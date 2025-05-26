export const transformedParticlePosition = /* wgsl */ `
    let size: f32 = getParticleSize(particlePosition.w, particleVelocity.w, params.colors[u32(particleData.w)].a);

    let previousPosition: vec3f = particlePosition.xyz - particleVelocity.xyz;
    let rotationMatrix: mat4x4f = lookAt(particlePosition.xyz, previousPosition);

    let velocityScale: vec3f = particleData.xyz * max(0.5, length(particleVelocity.xyz) * 0.5);

    let transformedPosition = (rotationMatrix * vec4(position * size * velocityScale, 1.0)).xyz;
`;
