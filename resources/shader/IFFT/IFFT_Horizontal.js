import {wgslFn} from "three/tsl";


export const IFFT_HorizontalWGSL = wgslFn(`

	fn computeWGSL(
		butterflyBuffer: ptr<storage, array<vec4<f32>>, read>,
		pingpongBuffer: ptr<storage, array<vec4<f32>>, read_write>,
		initBufferIndex: u32,
		index: u32,
		size: u32,
		step: u32,
		logN: u32,
		pingpong: u32,
	) -> void {

		var posX = index % size;
		var posY = index / size;

		let butterflyIndex = posX * logN + step;
		let data = butterflyBuffer[butterflyIndex];

		let bufferIndexEven = posY * size + u32(data.z);
		let bufferIndexOdd = posY * size + u32(data.w);

		var even = select(pingpongBuffer[bufferIndexEven].xy, pingpongBuffer[bufferIndexEven].zw, pingpong == 0);
		var odd  = select(pingpongBuffer[bufferIndexOdd].xy, pingpongBuffer[bufferIndexOdd].zw, pingpong == 0);

		var H: vec2<f32> = even + multiplyComplex( data.rg, odd );

		pingpongBuffer[index] = vec4<f32>(
			select(pingpongBuffer[index].xy, H, pingpong == 0),
			select(H, pingpongBuffer[index].zw, pingpong == 0)
		);

	}

	fn multiplyComplex(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
		return vec2<f32>(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
	}

`);