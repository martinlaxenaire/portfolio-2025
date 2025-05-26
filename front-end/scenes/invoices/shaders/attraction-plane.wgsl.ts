export const attractionPlaneFs = /* wgsl */ `
struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};
  
@fragment fn main(fsInput: VSOutput) -> @location(0) vec4f {
    let uv: vec2f = fsInput.uv;

    // Compute aspect ratio correction
    let aspect = params.resolution.x / params.resolution.y;

    // Center UVs at (0.5, 0.5)
    var mousePosition = vec2(params.mousePosition.x, 1.0 - params.mousePosition.y);
    var centeredUV = uv - mousePosition;
    centeredUV.x *= aspect; // Scale x to match y

    // Apply rotation using a 2D rotation matrix
    let angleOffset = params.time * params.speed; // Rotation angle in radians
    let cosA = cos(angleOffset);
    let sinA = sin(angleOffset);

    // Rotate the centered UVs
    centeredUV = vec2<f32>(
        cosA * centeredUV.x - sinA * centeredUV.y,
        sinA * centeredUV.x + cosA * centeredUV.y
    );

    // Compute radial distance from center
    var radialDist = length(centeredUV) * 2.0; // Scale to range [0, 2]

    // Compute angle around the center
    let angle = atan2(centeredUV.y, centeredUV.x);


    // Number of sides in the polygon
    let nbSides = params.nbSides; // Hexagon-like shape
    let segmentAngle = 2.0 * 3.141592 / nbSides;

    // Compute the fractional part of the angle within each segment
    let angleInSegment = angle - floor(angle / segmentAngle) * segmentAngle;

    // Strength of the arc deformation
    let arcStrength = -params.arcStrength;

    // Create an arc-like distortion by modifying radial distance
    let arcDeformation = sin(angleInSegment / segmentAngle * 3.141592) * arcStrength;

    // Apply deformation to radial distance
    radialDist *= 1.0 - arcDeformation;

    //let edgeThreshold = smoothstep(3.0, 2.0, radialDist); // Define the edge region
    //let centerThreshold = smoothstep(0.5, 2.5, radialDist); // Define the edge region
    let edgeThreshold = smoothstep(params.outerSize, params.outerSize - 0.025, radialDist); // Define the edge region
    let centerThreshold = smoothstep(params.centerSize, params.centerSize + 0.025, radialDist); // Define the edge region

    let alpha = centerThreshold * edgeThreshold * smoothstep(0.0, 1.0, params.intensity);

    if(alpha < 0.05) {
        discard;
    }
    
    // Define number of polygons
    let numBands = f32(params.nbColors);
    let bandIndex = floor(radialDist * numBands * params.nbPolygons + params.time * params.speed * 15.0);

    // Fetch color based on band index
    let color = params.colors[i32(bandIndex) % params.nbColors];

    return vec4(color, 1.0) * alpha;
}
`;
