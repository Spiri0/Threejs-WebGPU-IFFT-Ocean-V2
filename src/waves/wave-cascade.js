import {THREE} from '../three-defs.js';
import {textureStore, instanceIndex, uniform, uint, storage, workgroupId, localId } from "three/tsl";
import {entity} from '../entity.js';
import InitialSpectrum from './initial-spectrum.js';
import {TimeSpectrumWGSL} from "../../resources/shader/IFFT/timeSpectrum.js";
import {IFFT_HorizontalWGSL} from "../../resources/shader/IFFT/IFFT_Horizontal.js";
import {IFFT_VerticalWGSL} from "../../resources/shader/IFFT/IFFT_Vertical.js";
import {IFFT_PermuteWGSL} from "../../resources/shader/IFFT/IFFT_permute.js";
import {TexturesMergerWGSL} from "../../resources/shader/IFFT/texturesMerger.js";
import {wave_constants} from './wave-constants.js';
import {IFFT_InitWGSL} from "../../resources/shader/IFFT/IFFT_init.js";



class WaveCascade extends entity.Component {
	constructor(params) {
		super();
		this.Init(params);
	}

	Init(params) {

		this.params_ = params;
		this.defaultWorkgroup = wave_constants.DEFAULT_WORKGROUP;

		this.logN = Math.log2( params.size );
		this.sqSize = params.size ** 2;
		this.bufferSize = this.sqSize * 2;

		this.initialSpectrum = new InitialSpectrum(params);
		this.spectrumBuffer = this.initialSpectrum.spectrumBuffer;
		this.waveDataBuffer = this.initialSpectrum.waveDataBuffer;


		//IFFT Buffers
		this.DxDzBuffer = new THREE.StorageBufferAttribute( new Float32Array( this.bufferSize ), 2 );
		this.DyDxzBuffer = new THREE.StorageBufferAttribute( new Float32Array( this.bufferSize ), 2 );
		this.DyxDyzBuffer = new THREE.StorageBufferAttribute( new Float32Array( this.bufferSize ), 2 );
		this.DxxDzzBuffer = new THREE.StorageBufferAttribute( new Float32Array( this.bufferSize ), 2 );
		this.pingpongBuffer = new THREE.StorageBufferAttribute( new Float32Array( this.bufferSize * 2 ), 4 );
		this.turbulenceBuffer = new THREE.StorageBufferAttribute( new Float32Array( this.bufferSize / 2 ), 1 );

		this.DDindex = uniform( 0 );
		this.ifftStep = uniform( 0 );
		this.pingpong = uniform( 0 );
		this.deltaTime = uniform( 0 );


		this.displacement = new THREE.StorageTexture(params.size, params.size);
		this.derivative = new THREE.StorageTexture(params.size, params.size);
		this.jacobian = new THREE.StorageTexture(params.size, params.size);

		this.displacement.type = THREE.HalfFloatType;
		this.derivative.type = THREE.HalfFloatType;
		this.jacobian.type = THREE.FloatType;

		this.displacement.generateMipmaps = true;
		this.derivative.generateMipmaps = true;
		this.jacobian.generateMipmaps = true;

		this.displacement.magFilter = THREE.LinearFilter;
		this.derivative.magFilter = THREE.LinearFilter;
		this.jacobian.magFilter = THREE.LinearFilter;

		this.displacement.minFilter = THREE.LinearMipMapLinearFilter;
		this.derivative.minFilter = THREE.LinearMipMapLinearFilter;
		this.jacobian.minFilter = THREE.LinearMipMapLinearFilter;

		this.displacement.wrapS = this.displacement.wrapT = THREE.RepeatWrapping;
		this.derivative.wrapS = this.derivative.wrapT = THREE.RepeatWrapping;
		this.jacobian.wrapS = this.jacobian.wrapT = THREE.RepeatWrapping;

		this.displacement.anisotropy = this.params_.renderer.getMaxAnisotropy();
		this.derivative.anisotropy = this.params_.renderer.getMaxAnisotropy();
		this.jacobian.anisotropy = this.params_.renderer.getMaxAnisotropy();


		this.workgroupSize = wave_constants.WORKGROUP;
		this.dispatchSize = [ params.size / this.workgroupSize[ 0 ], params.size / this.workgroupSize[ 1 ] ];


		this.computeTimeSpectrum = TimeSpectrumWGSL({ 
			writeDxDzBuffer: storage( this.DxDzBuffer, 'vec2', this.DxDzBuffer.count ),
			writeDyDxzBuffer: storage( this.DyDxzBuffer, 'vec2', this.DyDxzBuffer.count ),
			writeDyxDyzBuffer: storage( this.DyxDyzBuffer, 'vec2', this.DyxDyzBuffer.count ),
			writeDxxDzzBuffer: storage( this.DxxDzzBuffer, 'vec2', this.DxxDzzBuffer.count ),
			spectrumBuffer: storage( this.spectrumBuffer, 'vec4', this.spectrumBuffer.count ),
			waveDataBuffer: storage( this.waveDataBuffer, 'vec4', this.waveDataBuffer.count ),
			index: instanceIndex,
			size: uint( params.size ),
			time: uniform(0)
		}).computeKernel( this.workgroupSize );
  

		this.computeInitialize = IFFT_InitWGSL({ 
			size: uint( params.size ),
			step: uint( this.ifftStep ),
			logN: uint( this.logN ),
			butterflyBuffer: storage( params.butterflyBuffer, 'vec4', params.butterflyBuffer.count ).toReadOnly(),
			DxDzBuffer: storage( this.DxDzBuffer, 'vec2', this.DxDzBuffer.count ).toReadOnly(),
			DyDxzBuffer: storage( this.DyDxzBuffer, 'vec2', this.DyDxzBuffer.count ).toReadOnly(),
			DyxDyzBuffer: storage( this.DyxDyzBuffer, 'vec2', this.DyxDyzBuffer.count ).toReadOnly(),
			DxxDzzBuffer: storage( this.DxxDzzBuffer, 'vec2', this.DxxDzzBuffer.count ).toReadOnly(),
			pingpongBuffer: storage( this.pingpongBuffer, 'vec4', this.pingpongBuffer.count ),
			initBufferIndex: uint( this.DDindex ),
			index: instanceIndex,
			workgroupSize: uniform( new THREE.Vector2().fromArray( this.workgroupSize ) ),
			workgroupId: workgroupId, 
			localId: localId			
		}).computeKernel( this.workgroupSize );


		this.computeHorizontalPingPong = IFFT_HorizontalWGSL({ 
			size: uint( params.size ),
			step: uint( this.ifftStep ),
			logN: uint( this.logN ),
			butterflyBuffer: storage( params.butterflyBuffer, 'vec4', params.butterflyBuffer.count ).toReadOnly(),
			pingpongBuffer: storage( this.pingpongBuffer, 'vec4', this.pingpongBuffer.count ),
			initBufferIndex: uint( this.DDindex ),
			pingpong: uint( this.pingpong ),
			index: instanceIndex,
			workgroupSize: uniform( new THREE.Vector2().fromArray( this.workgroupSize ) ),
			workgroupId: workgroupId, 
			localId: localId
		}).computeKernel( this.workgroupSize );


		this.computeVerticalPingPong = IFFT_VerticalWGSL({
			size: uint( params.size ),
			step: uint( this.ifftStep ),
			logN: uint( this.logN ),
			butterflyBuffer: storage( params.butterflyBuffer, 'vec4', params.butterflyBuffer.count ).toReadOnly(),
			pingpongBuffer: storage( this.pingpongBuffer, 'vec4', this.pingpongBuffer.count ),
			initBufferIndex: uint( this.DDindex ),
			pingpong: uint( this.pingpong ),
			index: instanceIndex,
			workgroupSize: uniform( new THREE.Vector2().fromArray( this.workgroupSize ) ),
			workgroupId: workgroupId, 
			localId: localId
		}).computeKernel( this.workgroupSize );


		this.computePermute = IFFT_PermuteWGSL({ 
			size: uint( params.size ),
			pingpongBuffer: storage( this.pingpongBuffer, 'vec4', this.pingpongBuffer.count ).toReadOnly(),
			DxDzBuffer: storage( this.DxDzBuffer, 'vec2', this.DxDzBuffer.count ),
			DyDxzBuffer: storage( this.DyDxzBuffer, 'vec2', this.DyDxzBuffer.count ),
			DyxDyzBuffer: storage( this.DyxDyzBuffer, 'vec2', this.DyxDyzBuffer.count ),
			DxxDzzBuffer: storage( this.DxxDzzBuffer, 'vec2', this.DxxDzzBuffer.count ),
			initBufferIndex: uint( this.DDindex ),
			index: instanceIndex,
			workgroupSize: uniform( new THREE.Vector2().fromArray( this.workgroupSize ) ),
			workgroupId: workgroupId, 
			localId: localId
		}).computeKernel( this.workgroupSize );


		this.computeMergeTextures = TexturesMergerWGSL({ 
			size: uint( params.size ),
			index: instanceIndex,
			lambda: uniform(params.lambda),
			deltaTime: this.deltaTime,
			DxDzBuffer: storage( this.DxDzBuffer, 'vec2', this.DxDzBuffer.count ).toReadOnly(),
			DyDxzBuffer: storage( this.DyDxzBuffer, 'vec2', this.DyDxzBuffer.count ).toReadOnly(),
			DyxDyzBuffer: storage( this.DyxDyzBuffer, 'vec2', this.DyxDyzBuffer.count ).toReadOnly(),
			DxxDzzBuffer: storage( this.DxxDzzBuffer, 'vec2', this.DxxDzzBuffer.count ).toReadOnly(),
			turbulenceBuffer: storage( this.turbulenceBuffer, 'float', this.turbulenceBuffer.count ),
			writeDisplacement: textureStore(this.displacement),
			writeDerivative: textureStore(this.derivative),
			writeJacobian: textureStore(this.jacobian),
			workgroupSize: uniform( new THREE.Vector2().fromArray( this.workgroupSize ) ),
			workgroupId: workgroupId, 
			localId: localId
		}).computeKernel( this.workgroupSize );

	}


	Update( dt ) {

		this.computeTimeSpectrum.computeNode.parameters.time.value = performance.now() / 1000;

		this.params_.renderer.compute(this.computeTimeSpectrum, this.dispatchSize );

		this.IFFT( 0 );	//DxDz
		this.IFFT( 1 );	//DyDxz
		this.IFFT( 2 );	//DyxDyz
		this.IFFT( 3 );	//DxxDzz

		this.deltaTime.value = dt;
		this.params_.renderer.compute(this.computeMergeTextures, this.dispatchSize );

	}


	IFFT( index ) {

		this.DDindex.value = index;
		let pingpong = true;

		this.ifftStep.value = 0;
		this.params_.renderer.compute( this.computeInitialize, this.dispatchSize );

		for(let i = 1; i < this.logN; i++){

			pingpong = !pingpong;
			this.ifftStep.value = i;
			this.pingpong.value = pingpong ? 1 : 0;
			this.params_.renderer.compute( this.computeHorizontalPingPong, this.dispatchSize );

		}
		for(let i = 0; i < this.logN; i++){

			pingpong = !pingpong;
			this.ifftStep.value = i;
			this.pingpong.value = pingpong ? 1 : 0;
			this.params_.renderer.compute( this.computeVerticalPingPong, this.dispatchSize );
		}

		this.params_.renderer.compute( this.computePermute, this.dispatchSize );
 
	}

}


export default WaveCascade;
	
  




