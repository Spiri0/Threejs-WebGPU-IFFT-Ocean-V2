import {wgslFn} from "three/nodes";


export const TimeSpectrumWGSL = wgslFn(`

	fn computeWGSL(
 		writeDxDz: texture_storage_2d<rgba32float, write>,
		writeDyDxz: texture_storage_2d<rgba32float, write>,
		writeDyxDyz: texture_storage_2d<rgba32float, write>,
		writeDxxDzz: texture_storage_2d<rgba32float, write>,
		readSpectrum: texture_2d<f32>,
		readWaveData: texture_2d<f32>,
		index: u32,
		size: f32,
		time: f32,
	) -> void {

		var posX = index % u32(size);
		var posY = index / u32(size);
		var idx = vec2u(posX, posY);


		var wave = textureLoad(readWaveData, idx, 0);
		var phase = wave.w * time;
		var exponent = vec2<f32>(cos(phase), sin(phase));
		var h0 = textureLoad(readSpectrum, idx, 0);
		var h = complexMult(h0.xy, exponent) + complexMult(h0.zw, vec2<f32>(exponent.x, -exponent.y));
		var ih = vec2<f32>(-h.y, h.x);

		var displacementX = ih * wave.x * wave.y;
		var displacementY = h;
		var displacementZ = ih * wave.z * wave.y;

		//Jacobi-Matrix-Elements
		var displacementX_dx = -h * wave.x * wave.x * wave.y;
		var displacementY_dx = ih * wave.x;
		var displacementZ_dx = -h * wave.x * wave.z * wave.y;
	 
		var displacementY_dz = ih * wave.z;
		var displacementZ_dz = -h * wave.z * wave.z * wave.y;
		//displacementX_dz ist the same like displacementZ_dx

		//Sum up all amplitudes (real and complex)
		textureStore(writeDxDz,   idx, vec4<f32>(displacementX.x - displacementZ.y, displacementX.y + displacementZ.x, 0., 0.));
		textureStore(writeDyDxz,  idx, vec4<f32>(displacementY.x - displacementZ_dx.y, displacementY.y + displacementZ_dx.x, 0., 0.));
		textureStore(writeDyxDyz, idx, vec4<f32>(displacementY_dx.x - displacementY_dz.y, displacementY_dx.y + displacementY_dz.x, 0., 0.));
		textureStore(writeDxxDzz, idx, vec4<f32>(displacementX_dx.x - displacementZ_dz.y, displacementX_dx.y + displacementZ_dz.x, 0., 0.));
	}

	fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>
	{
		return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
	}
`);
