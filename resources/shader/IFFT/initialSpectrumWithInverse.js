import {wgslFn} from "three/tsl";


export const InitialSpectrumWithInverseWGSL = wgslFn(`

	fn computeWGSL( 
		spectrumBuffer: ptr<storage, array<vec4<f32>>, read_write>,
		index: u32,
		size: u32,
	) -> void {

		var idx = ( (size - index / size) % size ) * size + (size - index % size) % size;

		var spectrumData = spectrumBuffer[ index ];
		var h0MinusK = spectrumBuffer[ idx ];

		spectrumBuffer[ index ] = vec4<f32>( spectrumData.xy, h0MinusK.x, -h0MinusK.y );
	}
`);
