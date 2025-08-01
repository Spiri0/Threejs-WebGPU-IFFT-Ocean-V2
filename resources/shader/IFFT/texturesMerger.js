import {wgslFn} from "three/tsl";


export const TexturesMergerWGSL = wgslFn(`

	fn computeWGSL( 
		writeDisplacement: texture_storage_2d<rgba16float, write>,
		writeDerivative: texture_storage_2d<rgba16float, write>,
		writeJacobian: texture_storage_2d<rgba32float, write>,
		DxDzBuffer: ptr<storage, array<vec2<f32>>, read>,
		DyDxzBuffer: ptr<storage, array<vec2<f32>>, read>,
		DyxDyzBuffer: ptr<storage, array<vec2<f32>>, read>,
		DxxDzzBuffer: ptr<storage, array<vec2<f32>>, read>,
		turbulenceBuffer: ptr<storage, array<f32>, read_write>,
		index: u32,
		size: u32,
		lambda: f32,
		deltaTime: f32,
		workgroupSize: vec2<u32>,
		workgroupId: vec3<u32>,
		localId: vec3<u32>,
	) -> void {

		let pos = workgroupSize.xy * workgroupId.xy + localId.xy;
 
		let bufferIndex = pos.y * size + pos.x;

		var x = DxDzBuffer[bufferIndex];
		var y = DyDxzBuffer[bufferIndex];
		var z = DyxDyzBuffer[bufferIndex];
		var w = DxxDzzBuffer[bufferIndex];

		//The determinant of the Jacobi matrix is a measure of the curvature of the differential surface. 
		//The curvature is particularly high at the crests of the waves. At these points, 
		//the higher energy density leads to foam formation.

		var jacobian = (1 + lambda * w.x) * (1 + lambda * w.y) - y.y * y.y * lambda * lambda;

		var turbulence = turbulenceBuffer[bufferIndex] + deltaTime * 0.5 / max(jacobian, 0.5);
		turbulence = min(jacobian, turbulence);

		textureStore(writeDisplacement, pos, vec4f(lambda * x.x, y.x, lambda * x.y, 0));
		textureStore(writeDerivative, pos, vec4f(z.x, z.y, w.x * lambda, w.y * lambda));
		textureStore(writeJacobian, pos, vec4f(turbulence, 0, 0, 0));
		turbulenceBuffer[bufferIndex] = turbulence;

	}

`);
