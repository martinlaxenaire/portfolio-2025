import { curlNoise } from "./chunks/curl-noise.wgsl";

export const computeCurl: string = /* wgsl */ `
   ${curlNoise}
  
  // https://gist.github.com/munrocket/236ed5ba7e409b8bdf1ff6eca5dcdc39
  // On generating random numbers, with help of y= [(a+x)sin(bx)] mod 1", W.J.J. Rey, 22nd European Meeting of Statisticians 1998
  fn rand11(n: f32) -> f32 { return fract(sin(n) * 43758.5453123); }
  
  fn getInitLife(index: f32) -> f32 {
    return (round(rand11(cos(index)) * params.maxLife * 0.8) + params.maxLife * 0.2);
  }
  
  @compute @workgroup_size(256) fn updateData(
    @builtin(global_invocation_id) GlobalInvocationID: vec3<u32>
  ) {
    let index = GlobalInvocationID.x;

    if(index < arrayLength(&particles)) {
      let fIndex: f32 = f32(index);

      var vPos: vec3f = particles[index].position.xyz;
      var life: f32 = particles[index].position.w;
      life -= 1.0;

      var vVel: vec3f = particles[index].velocity.xyz;

      // curl
      vVel += curlNoise(vPos * 0.01 * params.curlStrength, params.time * params.timeScale, params.curlPersistence);
      vVel *= params.speed * (0.25 + 0.75 * params.maxLifeRatio);

      // move towards second mouse position
      var directionToCenter = vPos - params.secondMousePosition;
      let distanceToCenter = length(directionToCenter);
      let pointDistance = distance(params.firstMousePosition, params.secondMousePosition);

      if(pointDistance > 0.0) {
        vVel -= normalize(directionToCenter) * params.mouseStrength * max(distanceToCenter, 0.1);
      }
      
      if (life <= 0.0) {
        // respawn particle to original position
        vPos = initParticles[index].position.xyz * (2.0 - params.maxLifeRatio) * params.radius;

        // add first mouse position
        vPos += vec3(params.firstMousePosition);

        // reset init life to random value
        initParticles[index].position.w = getInitLife(fIndex * cos(fIndex));
        life = initParticles[index].position.w;

        particles[index].velocity.w = life;
      } else {
        // apply new curl noise position and life
        vPos += vVel;
      }

      particles[index].velocity = vec4(vVel, particles[index].velocity.w);
      particles[index].position = vec4(vPos, life);
    }
  }
`;
