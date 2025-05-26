export const curlParticlesHelpers = /* wgsl */ `
    fn lookAt(origin: vec3f, lookAt: vec3f) -> mat4x4f {
        var up: vec3f = vec3(0.0, 1.0, 0.0);
    
        let forward = normalize(lookAt - origin);
        let right = normalize(cross(up, forward));
        let newUp = cross(forward, right);
    
        return mat4x4f(
            vec4(right, 0.0),
            vec4(newUp, 0.0),
            vec4(forward, 0.0),
            //vec4(origin, 1.0)
            vec4(0.0, 0.0, 0.0, 1.0)
        );
    }

  fn getParticleSize(currentLife: f32, initialLife: f32, isVisible: f32) -> f32 {    
    // scale from 0 -> 1 when life begins
    let startSize = smoothstep(0.0, 0.25, 1.0 - currentLife / initialLife);
    // scale from 1 -> 0 when life ends
    let endSize = smoothstep(0.0, 0.25, currentLife / initialLife);
    
    return startSize * endSize * params.size * isVisible;
  }
`;
