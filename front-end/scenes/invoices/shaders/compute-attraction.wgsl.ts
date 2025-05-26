export const computeAttraction = /* wgsl */ `

fn constrainToFrustum(pos: vec3<f32>, ptr_velocity: ptr<function, vec3<f32>>, radius: f32) -> vec3<f32> {
    var correctedPos = pos;

    for (var i = 0u; i < 6u; i++) { // Loop through 6 planes
        let plane = params.boxPlanes[i];
        let dist = dot(plane.xyz, correctedPos) + plane.w;

        if (dist < radius) { // If inside the plane boundary (radius = 1)
            // Move the point inside the frustum
            let correction = plane.xyz * (-dist + radius); // Push inside the frustum
            
            // Apply the position correction
            correctedPos += correction;

            // Reflect velocity with damping
            let normal = plane.xyz;
            let velocityAlongNormal = dot(*(ptr_velocity), normal);
            
            if (velocityAlongNormal < 0.0) { // Ensure we only reflect if moving towards the plane
                *(ptr_velocity) -= (1.0 + params.boxReboundFactor) * velocityAlongNormal * normal;
            }
        }
    }
    return correctedPos;
}

fn quaternionFromAngularVelocity(omega: vec3f, dt: f32) -> vec4f {
    let theta = length(omega) * dt;
    if (theta < 1e-5) {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }
    let axis = normalize(omega);
    let halfTheta = 0.5 * theta;
    let sinHalf = sin(halfTheta);
    return vec4(axis * sinHalf, cos(halfTheta));
}

fn quaternionMul(a: vec4f, b: vec4f) -> vec4f {
    return vec4(
        a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz),
        a.w * b.w - dot(a.xyz, b.xyz)
    );
}

fn integrateQuaternion(q: vec4f, angularVel: vec3f, dt: f32) -> vec4f {
    let omega = vec4(angularVel, 0.0);
    let dq = 0.5 * quaternionMul(q, omega);
    return normalize(q + dq * dt);
}

@compute @workgroup_size(64) fn main(
    @builtin(global_invocation_id) GlobalInvocationID: vec3<u32>
) {
    var index = GlobalInvocationID.x;
    
    var vPos = particlesA[index].position.xyz;

    var vVel = particlesA[index].velocity.xyz;
    var collision = particlesA[index].velocity.w;

    var vQuat = particlesA[index].rotation;
    var angularVelocity = particlesA[index].angularVelocity.xyz;

    var vData = particlesA[index].data;

    let sphereRadius = vData.x;
    var newCollision = vData.y;

    
    collision += (newCollision - collision) * 0.2;
    collision = smoothstep(0.0, 1.0, collision);
    newCollision = max(0.0, newCollision - 0.0325);

    //let mousePosition: vec3f = vec3(params.mousePosition, 0.0);
    let mousePosition: vec3f = params.mousePosition;
    let minDistance: f32 = sphereRadius; // Minimum allowed distance between spheres

    // Compute attraction towards sphere 0
    var directionToCenter = mousePosition - vPos;
    let distanceToCenter = length(directionToCenter);

    // Slow down when close to the attractor
    var dampingFactor = smoothstep(0.0, minDistance, distanceToCenter);
    
    if (distanceToCenter > minDistance && params.mouseAttraction > 0.0) { // Only attract if outside the minimum distance
        vVel += normalize(directionToCenter) * params.mouseAttraction * dampingFactor;
        vVel *= 0.95;
    }
    
    // Collision Handling: Packing spheres instead of pushing them away
    var particlesArrayLength = arrayLength(&particlesA);
    
    for (var i = 0u; i < particlesArrayLength; i++) {
        if (i == index) {
            continue;
        }
        
        let otherPos = particlesA[i].position.xyz;
        let otherRadius = particlesA[i].data.x;
        let collisionMinDist = sphereRadius + otherRadius;
        let toOther = otherPos - vPos;
        let dist = length(toOther);

        if (dist < collisionMinDist) { 
            let pushDir = normalize(toOther);
            let overlap = collisionMinDist - dist;
            let pushStrength = otherRadius / sphereRadius; // radius
            
            // Push away proportionally to overlap
            vVel -= pushDir * (overlap * params.spheresRepulsion) * pushStrength;
            newCollision = min(1.0, pushStrength * 1.5);

            let r = normalize(cross(pushDir, vVel));
            angularVelocity += r * length(vVel) * 0.1 * pushStrength;
        }
    }

    let projectedVelocity = dot(vVel, directionToCenter); // Velocity component towards mouse

    let mainSphereRadius = 1.0;

    if(distanceToCenter <= (mainSphereRadius + minDistance)) {
        let pushDir = normalize(directionToCenter);
        let overlap = (mainSphereRadius + minDistance) - distanceToCenter;
        
        // Push away proportionally to overlap
        vVel -= pushDir * (overlap * params.spheresRepulsion) * (2.0 + params.mouseAttraction);

        newCollision = 1.0;

        if(params.mouseAttraction > 0.0) {
            vPos -= pushDir * overlap;
        }

        let r = normalize(cross(pushDir, vVel));
        angularVelocity += r * length(vVel) * 0.05;
    }

    vPos = constrainToFrustum(vPos, &vVel, sphereRadius);

    // Apply velocity update
    vPos += vVel * params.deltaT;

    angularVelocity *= 0.98;
    // let dq = quaternionFromAngularVelocity(angularVelocity, params.deltaT);
    // let updatedQuat = normalize(quaternionMul(dq, vQuat));
    let updatedQuat = integrateQuaternion(vQuat, angularVelocity, params.deltaT);;
    
    // Write back      
    particlesB[index].position = vec4(vPos, 0.0);
    particlesB[index].velocity = vec4(vVel, collision);
    particlesB[index].data = vec4(vData.x, newCollision, vData.z, vData.w);
    particlesB[index].rotation = updatedQuat;
    particlesB[index].angularVelocity = vec4(angularVelocity, 1.0);
}
`;
