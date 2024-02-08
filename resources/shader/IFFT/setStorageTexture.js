import {wgslFn} from "three/nodes";


export const SetStorageTextureWGSL = wgslFn(`

    fn computeWGSL( 
        writeTex: texture_storage_2d<rgba32float, write>,
	    readTex: texture_2d<f32>,
        index: u32,
        size: f32,
    ) -> void {

        var posX = f32(index) % size;
        var posY = floor(f32(index) / size);
        var idx = vec2i(i32(posX), i32(posY));

	    var texture = textureLoad(readTex, idx, 0);
        textureStore(writeTex, idx, texture);
    }
`);

