import {wgslFn} from "three/tsl";


export const IFFT_InitWGSL = wgslFn(`

	fn computeWGSL(
		butterflyBuffer: ptr<storage, array<vec4<f32>>, read>,
		pingpongBuffer: ptr<storage, array<vec4<f32>>, read_write>,
		DxDzBuffer: ptr<storage, array<vec2<f32>>, read>,
		DyDxzBuffer: ptr<storage, array<vec2<f32>>, read>,
		DyxDyzBuffer: ptr<storage, array<vec2<f32>>, read>,
		DxxDzzBuffer: ptr<storage, array<vec2<f32>>, read>,
		initBufferIndex: u32,
		index: u32,
		size: u32,
		step: u32,
		logN: u32,
		workgroupSize: vec2<u32>,
		workgroupId: vec3<u32>,
		localId: vec3<u32>
	) -> void {

		let pos = workgroupSize.xy * workgroupId.xy + localId.xy;

		let butterflyIndex = pos.x * logN + step;
		let data = butterflyBuffer[ butterflyIndex ];

		let bufferIndex = pos.y * size + u32( data.z );
		let bufferIndexOdd = pos.y * size + u32( data.w );

		var even = select(DxDzBuffer[ bufferIndex ], DyDxzBuffer[ bufferIndex ], initBufferIndex == 1u );
		even = select(even, DyxDyzBuffer[ bufferIndex ], initBufferIndex == 2u );
		even = select(even, DxxDzzBuffer[ bufferIndex ], initBufferIndex == 3u );

		var odd = select( DxDzBuffer[ bufferIndexOdd ], DyDxzBuffer[ bufferIndexOdd ], initBufferIndex == 1u );
		odd = select(odd, DyxDyzBuffer[ bufferIndexOdd ], initBufferIndex == 2u );
		odd = select(odd, DxxDzzBuffer[ bufferIndexOdd ], initBufferIndex == 3u );

		var H: vec2<f32> = even + multiplyComplex( vec2<f32>( data.r, -data.g ), odd );

		pingpongBuffer[ index ] = vec4<f32>( 0.0, 0.0, H );

	}

	fn multiplyComplex(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
		return vec2<f32>(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
	}

`);
