export const discardParticle = /* wgsl */ `
if(params.colors[u32(data.w)].a < 0.1) {
    discard;
}
`;
