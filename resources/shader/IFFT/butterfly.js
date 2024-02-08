import {wgslFn} from "three/nodes";


export const butterflyWGSL = wgslFn(`

    fn computeWGSL( 
        writeButterfly: texture_storage_2d<rgba32float, write>,
        index: u32, 
        N: f32,
    ) -> void {

        var posX = f32(index) % log2(N);
        var posY = floor(f32(index) / log2(N));
        var idx = vec2u(u32(posX), u32(posY));

        const PI: f32 = 3.1415926;

        var k: f32 = (posY * N/pow(2, posX + 1)) % N;
        var twiddle: vec2<f32> = vec2<f32>(cos(2 * PI * k / N), sin(2 * PI * k / N));
        var butterflyspan: f32 = pow(2, f32(posX));
        var butterflywing: u32 = 0;

        if(posY % pow(2, posX + 1) < pow(2, posX)){
            butterflywing = 1;
        }
        else{
            butterflywing = 0;
        }

        if(u32(posX) == 0){
            if(butterflywing == 1){
                textureStore(writeButterfly, idx, vec4f(twiddle.x, twiddle.y, reverseBits(idx.y, N), reverseBits(idx.y + 1, N)));
            }
            else{
                textureStore(writeButterfly, idx, vec4f(twiddle.x, twiddle.y, reverseBits(idx.y - 1, N), reverseBits(idx.y, N)));
            }
        }
        else{
            if(butterflywing == 1){
                textureStore(writeButterfly, idx, vec4f(twiddle.x, twiddle.y, posY, posY + butterflyspan));
            }
            else{
                textureStore(writeButterfly, idx, vec4f(twiddle.x, twiddle.y, posY - butterflyspan, posY));
            }
        }
    }

    fn reverseBits(index: u32, N: f32) -> f32 {
        var bitReversedIndex: u32 = 0;
        var numBits: u32 = u32(log2(N));
    
        for (var i: u32 = 0; i < numBits; i = i + 1) {
            bitReversedIndex = bitReversedIndex | (((index >> i) & 1) << (numBits - i - 1));
        } 
        return f32(bitReversedIndex);
    }
`);