import {THREE} from '../three-defs.js';
import { instanceIndex, uniform, storage } from "three/tsl";
import {entity} from '../entity.js';
import {InitialSpectrumWGSL} from "../../resources/shader/IFFT/initialSpectrum.js";
import {InitialSpectrumWithInverseWGSL} from "../../resources/shader/IFFT/initialSpectrumWithInverse.js";
import {wave_constants} from './wave-constants.js';



class InitialSpectrum extends entity.Component {
	constructor(params) {
		super();
		this.Init(params);
	}

	Init(params) {

		this.params_ = params;

		this.defaultWorkgroup = wave_constants.DEFAULT_WORKGROUP;

		this.sqSize = params.size ** 2;
		this.bufferSize = this.sqSize * 4;
		this.spectrumBuffer = new THREE.StorageBufferAttribute( new Float32Array( this.bufferSize ), 4 );
		this.waveDataBuffer = new THREE.StorageBufferAttribute( new Float32Array( this.bufferSize ), 4 );

		this.InitialSpectrum(params);
		this.InitialSpectrumWithInverse(params);

	}

 
	InitialSpectrum(params){

		this.initialSpectrum = InitialSpectrumWGSL({ 
			spectrumBuffer: storage( this.spectrumBuffer, 'vec4', this.spectrumBuffer.count ),
			waveDataBuffer: storage( this.waveDataBuffer, 'vec4', this.waveDataBuffer.count ),
			index: instanceIndex,
			size: params.size,
			waveLength: uniform(params.lengthScale),
			boundaryLow: uniform(params.boundaryLow),
			boundaryHigh: uniform(params.boundaryHigh),
			...params.waveSettings
		}).compute( this.sqSize );
		params.renderer.compute(this.initialSpectrum);
	}
        

	InitialSpectrumWithInverse(params){

		this.initialSpectrumWithInverse = InitialSpectrumWithInverseWGSL({ 
			spectrumBuffer: storage( this.spectrumBuffer, 'vec4', this.spectrumBuffer.count ),
			index: instanceIndex,
			size: params.size,
		}).compute( this.sqSize );
		params.renderer.compute(this.initialSpectrumWithInverse);
	}


	Update() {
		this.params_.renderer.compute(this.initialSpectrum);
		this.params_.renderer.compute(this.initialSpectrumWithInverse);
	}

}


export default InitialSpectrum;