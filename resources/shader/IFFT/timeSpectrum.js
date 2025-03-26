import {wgslFn} from "three/tsl";


export const TimeSpectrumWGSL = wgslFn(`

	fn computeWGSL(
		spectrumBuffer: ptr<storage, array<vec4<f32>>, read_write>,
		waveDataBuffer: ptr<storage, array<vec4<f32>>, read_write>,
		writeDxDzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
		writeDyDxzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
		writeDyxDyzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
		writeDxxDzzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
		index: u32,
		size: u32,
		time: f32,
	) -> void {

		var wave = waveDataBuffer[ index ];
		var h0 = spectrumBuffer[ index ];

		var phase = wave.w * time;
		var exponent = vec2<f32>(cos(phase), sin(phase));

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

		writeDxDzBuffer[ index ]   = vec2<f32>(displacementX.x - displacementZ.y, displacementX.y + displacementZ.x);
		writeDyDxzBuffer[ index ]  = vec2<f32>(displacementY.x - displacementZ_dx.y, displacementY.y + displacementZ_dx.x);
		writeDyxDyzBuffer[ index ] = vec2<f32>(displacementY_dx.x - displacementY_dz.y, displacementY_dx.y + displacementY_dz.x);
		writeDxxDzzBuffer[ index ] = vec2<f32>(displacementX_dx.x - displacementZ_dz.y, displacementX_dx.y + displacementZ_dz.x);

	}

	fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
		return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
	}
`);
