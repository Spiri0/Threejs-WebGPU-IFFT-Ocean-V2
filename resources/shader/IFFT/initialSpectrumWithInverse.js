import {wgslFn} from "three/nodes";


export const InitialSpectrumWithInverseWGSL = wgslFn(`

    fn computeWGSL( 
        writeSpectrum: texture_storage_2d<rgba32float, write>,
        readSpectrum: texture_2d<f32>,
        index: u32,
        size: f32,
    ) -> void {

        var posX = index % u32(size);
        var posY = index / u32(size);
        var idx = vec2u(posX, posY);
 
        var h0k = textureLoad(readSpectrum, idx, 0).xy;
        var h0MinusK = textureLoad(readSpectrum, vec2<u32>((u32(size) - idx.x) % u32(size), (u32(size) - idx.y) % u32(size)), 0);

        textureStore(writeSpectrum, idx, vec4f(h0k.x, h0k.y, h0MinusK.x, -h0MinusK.y));
    }       
`);
