export const wrappingBoxAdditionalHead = /* wgsl */ `
// ported from https://github.com/toji/pristine-grid-webgpu
// grid function from Best Darn Grid article
fn pristineGrid(uv: vec2f, lineWidth: vec2f) -> f32 {
    let uvDDXY = vec4f(dpdx(uv), dpdy(uv));
    let uvDeriv = vec2f(length(uvDDXY.xz), length(uvDDXY.yw));
    let invertLine: vec2<bool> = lineWidth > vec2f(0.5);
    let targetWidth: vec2f = select(lineWidth, 1 - lineWidth, invertLine);
    let drawWidth: vec2f = clamp(targetWidth, uvDeriv, vec2f(0.5));
    let lineAA: vec2f = uvDeriv * 1.5;
    var gridUV: vec2f = abs(fract(uv) * 2.0 - 1.0);
    gridUV = select(1 - gridUV, gridUV, invertLine);
    var grid2: vec2f = smoothstep(drawWidth + lineAA, drawWidth - lineAA, gridUV);
    grid2 *= saturate(targetWidth / drawWidth);
    grid2 = mix(grid2, targetWidth, saturate(uvDeriv * 2.0 - 1.0));
    grid2 = select(grid2, 1.0 - grid2, invertLine);
    return mix(grid2.x, 1.0, grid2.y);
}
`;

export const wrappingBoxPreliminaryContribution = /* wgsl */ `
    var lineWidth = grid.lineWidth;
    lineWidth.x *= grid.resolution.y / grid.resolution.x;
    let pristineGrid = pristineGrid(fsInput.uv * grid.scale, lineWidth);
    
    // lerp between 0 and color
    outputColor = mix(vec4(outputColor.rgb, 0.0), outputColor, pristineGrid);

    if(outputColor.a < alphaCutoff) {
        discard;
    } 
`;
