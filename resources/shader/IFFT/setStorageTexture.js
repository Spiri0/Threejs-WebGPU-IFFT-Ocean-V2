import {wgslFn} from "three/tsl";


export const SetStorageTextureWGSL = wgslFn(`

    fn computeWGSL( 
        writeTex: texture_storage_2d<rgba32float, write>,
	readTex: texture_2d<f32>,
        index: u32,
        size: f32,
    ) -> void {

        var posX = index % u32(size);
        var posY = index / u32(size);
        var idx = vec2u(posX, posY);

	var texture = textureLoad(readTex, idx, 0);
        textureStore(writeTex, idx, texture);
    }
`);

