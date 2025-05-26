import { discardParticle } from "./discard-particle.wgsl";

export const curlPreliminaryFragmentParticle = /* wgsl */ `
    outputColor = vec4(params.colors[u32(data.w)].rgb, 1.0);

    ${discardParticle}
`;
