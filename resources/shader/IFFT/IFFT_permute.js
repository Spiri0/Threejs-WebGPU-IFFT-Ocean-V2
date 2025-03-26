import {wgslFn} from "three/tsl";


export const IFFT_PermuteWGSL = wgslFn(`

	fn computeWGSL( 
		pingpongBuffer: ptr<storage, array<vec4<f32>>, read>,
		DxDzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
		DyDxzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
		DyxDyzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
		DxxDzzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
		initBufferIndex: u32,
		index: u32,
		size: u32,
	) -> void {

		var posX = index % size;
		var posY = index / size;

		var input = pingpongBuffer[ index ].xy;
		var output = input * (1.0 - 2.0 * f32((posX + posY) % 2));

		DxDzBuffer[ index ] = select( DxDzBuffer[index], output, initBufferIndex == 0u );
		DyDxzBuffer[ index ] = select( DyDxzBuffer[index], output, initBufferIndex == 1u );
		DyxDyzBuffer[ index ] = select( DyxDyzBuffer[index], output, initBufferIndex == 2u );
		DxxDzzBuffer[ index ] = select( DxxDzzBuffer[index], output, initBufferIndex == 3u );

	} 

`);

