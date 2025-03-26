import {wgslFn} from "three/tsl";


export const butterflyWGSL = wgslFn(`

    fn computeWGSL( 
        butterflyBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        index: u32, 
        N: f32,
    ) -> void {

        var logN = log2(N);
        var posX = f32(index) % logN;
        var posY = floor(f32(index) / logN);

        const PI: f32 = 3.1415926;

        var k: f32 = (posY * N/pow(2, posX + 1)) % N;
        var twiddle: vec2<f32> = vec2<f32>(cos(2 * PI * k / N), sin(2 * PI * k / N));

        var butterflyspan = pow(2, f32(posX));
        let idx = u32(posY) * u32(logN) + u32(posX);
        var butterflywing: i32 = select(0, 1, posY % pow(2, posX + 1) < pow(2, posX));
        var uY = u32(posY);

        if(u32(posX) == 0){
            if(butterflywing == 1){
                butterflyBuffer[idx] = vec4f( twiddle, reverseBits(uY, N), reverseBits(uY + 1, N) );
            }
            else{
                butterflyBuffer[idx] = vec4f( twiddle, reverseBits(uY - 1, N), reverseBits(uY, N) );
            }
        }
        else{
            if(butterflywing == 1){
                butterflyBuffer[idx] = vec4f( twiddle, posY, posY + butterflyspan);
            }
            else{
                butterflyBuffer[idx] = vec4f( twiddle, posY - butterflyspan, posY);
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