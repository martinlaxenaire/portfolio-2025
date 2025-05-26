export const attractionShadowMap = /* wgsl */ `
struct PointShadowVSOutput {
    @builtin(position) position: vec4f,
    @location(0) worldPosition: vec3f,
}

@vertex fn shadowMapVertex(
attributes: Attributes,
) -> PointShadowVSOutput {  
    var pointShadowVSOutput: PointShadowVSOutput;
    let pointShadow: PointShadowsElement = pointShadows.pointShadowsElements[0];

    var position: vec3f = attributes.position;
    var normal: vec3f = attributes.normal;
    var instanceData: vec4f = attributes.instanceData;
    var instancePosition: vec4f = attributes.instancePosition;
    var instanceIndex: u32 = attributes.instanceIndex;

    position = position * instanceData.x + instancePosition.xyz;

    var worldPosition: vec4f = vec4(position, 1.0);

    var modelMatrix = matrices.model;
    worldPosition = modelMatrix * worldPosition;
    normal = getWorldNormal(normal);

    let worldPos = worldPosition.xyz / worldPosition.w;

    // shadows calculations in view space instead of world space
    // prevents world-space scaling issues for normal bias
    let viewMatrix: mat4x4f = pointShadow.viewMatrices[cubeFace.face];
    var shadowViewPos: vec3f = (viewMatrix * worldPosition).xyz;
    let lightViewPos: vec3f = (viewMatrix * vec4(pointShadow.position, 1.0)).xyz;

    // Transform normal into shadow view space
    let shadowNormal: vec3f = normalize((viewMatrix * vec4(normal, 0.0)).xyz);

    // Compute light direction in shadow space
    let lightDirection: vec3f = normalize(lightViewPos - shadowViewPos);

    let NdotL: f32 = dot(shadowNormal, lightDirection);
    let sinNdotL = sqrt(1.0 - NdotL * NdotL);
    let normalBias: f32 = pointShadow.normalBias * sinNdotL;

    // Apply bias in shadow view space
    shadowViewPos -= shadowNormal * normalBias;

    pointShadowVSOutput.position = pointShadow.projectionMatrix * vec4(shadowViewPos, 1.0);
    pointShadowVSOutput.worldPosition = worldPos;

    return pointShadowVSOutput;
}

@fragment fn shadowMapFragment(fsInput: PointShadowVSOutput) -> @builtin(frag_depth) f32 {
    let pointShadow: PointShadowsElement = pointShadows.pointShadowsElements[0];

    // get distance between fragment and light source
    var lightDistance: f32 = length(fsInput.worldPosition - pointShadow.position);
        
    // map to [0, 1] range by dividing by far plane - near plane
    lightDistance = (lightDistance - pointShadow.cameraNear) / (pointShadow.cameraFar - pointShadow.cameraNear);

    // write this as modified depth
    return saturate(lightDistance);
}
`;
