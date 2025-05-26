export const instancesAdditionalVertexHead = /* wgsl */ `
fn quatToMat4(q: vec4f) -> mat4x4f {
    let x = q.x;
    let y = q.y;
    let z = q.z;
    let w = q.w;

    let x2 = x + x;
    let y2 = y + y;
    let z2 = z + z;

    let xx = x * x2;
    let xy = x * y2;
    let xz = x * z2;
    let yy = y * y2;
    let yz = y * z2;
    let zz = z * z2;
    let wx = w * x2;
    let wy = w * y2;
    let wz = w * z2;

    return mat4x4f(
        vec4(1.0 - (yy + zz), xy + wz,       xz - wy,       0.0),
        vec4(xy - wz,       1.0 - (xx + zz), yz + wx,       0.0),
        vec4(xz + wy,       yz - wx,       1.0 - (xx + yy), 0.0),
        vec4(0.0,           0.0,           0.0,             1.0)
    );
}
`;
