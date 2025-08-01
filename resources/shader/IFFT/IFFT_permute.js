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
		workgroupSize: vec2<u32>,
		workgroupId: vec3<u32>,
		localId: vec3<u32>,
	) -> void {

		let pos = workgroupSize.xy * workgroupId.xy + localId.xy;

		let input = pingpongBuffer[ index ].xy;
		let output = input * ( 1.0 - 2.0 * f32( ( pos.x + pos.y ) % 2 ) );

		DxDzBuffer[ index ] = select( DxDzBuffer[index], output, initBufferIndex == 0u );
		DyDxzBuffer[ index ] = select( DyDxzBuffer[index], output, initBufferIndex == 1u );
		DyxDyzBuffer[ index ] = select( DyxDyzBuffer[index], output, initBufferIndex == 2u );
		DxxDzzBuffer[ index ] = select( DxxDzzBuffer[index], output, initBufferIndex == 3u );

	} 

`);
