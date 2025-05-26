export const computeYearsBackground = /* wgsl */ `
fn sdfRectangle(center: vec2f, size: vec2f) -> f32 {
    let dxy = abs(center) - size;
    return length(max(dxy, vec2(0.0))) + max(min(dxy.x, 0.0), min(dxy.y, 0.0));
}

@compute @workgroup_size(16, 16) fn main(
    @builtin(global_invocation_id) GlobalInvocationID: vec3<u32>
) {
    let bgTextureDimensions = vec2f(textureDimensions(backgroundStorageTexture));

    if(f32(GlobalInvocationID.x) <= bgTextureDimensions.x && f32(GlobalInvocationID.y) <= bgTextureDimensions.y) {
        let uv = vec2f(f32(GlobalInvocationID.x) / bgTextureDimensions.x - params.progress,
        f32(GlobalInvocationID.y) / bgTextureDimensions.y);

        var color = vec4f(0.0, 0.0, 0.0, 0.0); // Default to black
        let nbRectangles: u32 = arrayLength(&rectangles);

        for (var i: u32 = 0; i < nbRectangles; i++) {
        let rectangle = rectangles[i];

        let rectDist = sdfRectangle(uv - rectangle.positions, vec2(rectangle.sizes.x * params.intensity, rectangle.sizes.y));

        color = select(color, rectangle.colors * params.intensity, rectDist < 0.0);
        }

        textureStore(backgroundStorageTexture, vec2<i32>(GlobalInvocationID.xy), color);
    }
}
`;
