import * as THREE from "../../node_modules/three/build/three.module.js";


const _P = new THREE.Vector3();
const _N1 = new THREE.Vector3();
const _N2 = new THREE.Vector3();
const _N3 = new THREE.Vector3();
const _D1 = new THREE.Vector3();
const _D2 = new THREE.Vector3();



class OceanBuilderThreadedWorker {
	constructor() {
	}

	Init(params) {
		this.cachedParams_ = {...params};
		this.params_ = params;
		this.params_.offset = new THREE.Vector3(...params.offset);
	}

	//the indices for the bufferGeometry triangle vertices ccw (right hand coordinate system)
	GenerateIndices_() {
		const resolution = this.params_.resolution;
        	const indices = [];
		
		for (let i = 0; i < resolution; i++) {
			for (let j = 0; j < resolution; j++) {
				indices.push(
					i * (resolution + 1) + j,
					(i + 1) * (resolution + 1) + j + 1,
					i * (resolution + 1) + j + 1
				);
				indices.push(
					(i + 1) * (resolution + 1) + j,
					(i + 1) * (resolution + 1) + j + 1,
					i * (resolution + 1) + j
				);
			}
		}
		return indices;
	}


	GenerateNormals_(positions, indices) {
		const normals = new Array(positions.length).fill(0.0);
		for (let i = 0, n = indices.length; i < n; i += 3) {
			const i1 = indices[i] * 3;
			const i2 = indices[i+1] * 3;
			const i3 = indices[i+2] * 3;
	
			_N1.fromArray(positions, i1);
			_N2.fromArray(positions, i2);
			_N3.fromArray(positions, i3);
	
			_D1.subVectors(_N3, _N2);
			_D2.subVectors(_N1, _N2);
			_D1.cross(_D2);
	
			normals[i1] += _D1.x;
			normals[i2] += _D1.x;
			normals[i3] += _D1.x;
	
			normals[i1+1] += _D1.y;
			normals[i2+1] += _D1.y;
			normals[i3+1] += _D1.y;
	
			normals[i1+2] += _D1.z;
			normals[i2+2] += _D1.z;
			normals[i3+2] += _D1.z;
		}
		return normals;
	}


	Build() {
		const positions = [];
		const vindices = [];
        const widths = [];
        const lods = [];

		const localToWorld = this.params_.worldMatrix;
		const resolution = this.params_.resolution;
		const offset = this.params_.offset;
		const width = this.params_.width;
		const half = width / 2;
        const lod = this.params_.lod;

		let idx = 0;

        for (let x = 0; x < resolution + 1; x++) {
            const xp = width * x / resolution;
            for (let y = 0; y < resolution + 1; y++) {
                const yp = width * y / resolution;

				// Compute position
				_P.set(xp - half, yp - half, 0);
				_P.add(offset);
				_P.applyMatrix4(localToWorld);

				positions.push(_P.x, _P.y, _P.z);
				vindices.push(idx);
                widths.push(width);
                lods.push(lod);
				idx += 1;				
			}
		}

		const indices = this.GenerateIndices_();
		const normals = this.GenerateNormals_(positions, indices);
		const bytesInFloat32 = 4;
		const bytesInInt32 = 4;
		
		/*
		const positionsArray = new Float32Array(new SharedArrayBuffer(bytesInFloat32 * positions.length));
		const normalsArray = new Float32Array(new SharedArrayBuffer(bytesInFloat32 * normals.length));
        const widthArray = new Float32Array(new SharedArrayBuffer(bytesInFloat32 * vindices.length));
		const vindicesArray = new Uint32Array(new SharedArrayBuffer(bytesInInt32 * vindices.length));
		const indicesArray = new Uint32Array(new SharedArrayBuffer(bytesInInt32 * indices.length));
        const lodArray = new Uint32Array(new SharedArrayBuffer(bytesInInt32 * vindices.length));
		*/
		
		const positionsArray = new Float32Array(new ArrayBuffer(bytesInFloat32 * positions.length));
		const normalsArray = new Float32Array(new ArrayBuffer(bytesInFloat32 * normals.length));
        const widthArray = new Float32Array(new ArrayBuffer(bytesInFloat32 * vindices.length));
		const vindicesArray = new Uint32Array(new ArrayBuffer(bytesInInt32 * vindices.length));
		const indicesArray = new Uint32Array(new ArrayBuffer(bytesInInt32 * indices.length));
        const lodArray = new Uint32Array(new ArrayBuffer(bytesInInt32 * vindices.length));

		
		positionsArray.set(positions, 0);
		normalsArray.set(normals, 0);
		vindicesArray.set(vindices, 0);
		indicesArray.set(indices, 0);
        widthArray.set(widths, 0);
        lodArray.set(lods, 0);

		
		return {
			positions: positionsArray,
			normals: normalsArray,
			vindices: vindicesArray,
			indices: indicesArray,
            width: widthArray,
            lod: lodArray
		};
	}
}//end class


const CHUNK = new OceanBuilderThreadedWorker();

self.onmessage = (msg) => {
	CHUNK.Init(msg.data.params);
	const rebuiltData = CHUNK.Build();
	self.postMessage({data: rebuiltData});
};
