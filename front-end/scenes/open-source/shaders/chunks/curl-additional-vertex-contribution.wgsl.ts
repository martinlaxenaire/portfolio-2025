import { transformedParticlePosition } from "./transformed-particle-position.wgsl";

// https://www.clicktorelease.com/code/polygon-shredder/
export const curlAdditionalVertexParticle = /* wgsl */ `
  ${transformedParticlePosition}  

  // no need to apply scale or size to normals
  let transformedNormal = normalize((rotationMatrix * vec4(normal , 1.0)).xyz);
    
  worldPosition = modelMatrix * vec4(particlePosition.xyz + transformedPosition, 1.0);
  vsOutput.position = camera.projection * camera.view * worldPosition;
  
  vsOutput.worldPosition = (worldPosition.xyz / worldPosition.w);
  vsOutput.viewDirection = normalize(camera.position - vsOutput.worldPosition);
    
  vsOutput.normal = getWorldNormal(transformedNormal);
  
  vsOutput.velocity = particleVelocity;
  vsOutput.data = particleData;
`;
