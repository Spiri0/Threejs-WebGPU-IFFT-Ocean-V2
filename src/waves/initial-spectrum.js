import {THREE} from '../three-defs.js';
import {textureStore, instanceIndex, uniform, texture, vec2} from "three/tsl";
import {entity} from '../entity.js';
import {InitialSpectrumWGSL} from "../../resources/shader/IFFT/initialSpectrum.js";
import {InitialSpectrumWithInverseWGSL} from "../../resources/shader/IFFT/initialSpectrumWithInverse.js";
import {wave_constants} from './wave-constants.js';


export const initial_spectrum = (() => {

	class InitialSpectrum extends entity.Component {
		constructor(params) {
			super();
			this.Init(params);
		}

		Init(params) {
			this.params_ = params;


			this.defaultWorkgroup = wave_constants.DEFAULT_WORKGROUP;

			this.spectrumTexture = new THREE.StorageTexture(params.size, params.size);    
			this.waveDataTexture = new THREE.StorageTexture(params.size, params.size);
			this.h0k_Texture = new THREE.StorageTexture(params.size, params.size); 
			this.spectrumTexture.magFilter = this.spectrumTexture.minFilter = THREE.NearestFilter;
			this.waveDataTexture.magFilter = this.waveDataTexture.minFilter = THREE.NearestFilter;
			this.h0k_Texture.magFilter = this.h0k_Texture.minFilter = THREE.NearestFilter;
			this.spectrumTexture.type = THREE.FloatType;
			this.waveDataTexture.type = THREE.FloatType;
			this.h0k_Texture.type = THREE.FloatType;
            

			this.InitialSpectrum(params);
			this.InitialSpectrumWithInverse(params);

		}

 
		InitialSpectrum(params){

			const initialSpectrum = InitialSpectrumWGSL({ 
				writeSpectrum: textureStore(this.spectrumTexture),
				writeWaveData: textureStore(this.waveDataTexture),
				index: instanceIndex,
				size: params.size,
				waveLength: uniform(params.lengthScale),
				boundaryLow: uniform(params.boundaryLow),
				boundaryHigh: uniform(params.boundaryHigh),
				...params.waveSettings
			}).compute(params.size ** 2);
			params.renderer.compute(initialSpectrum, this.defaultWorkgroup);
		}
        

		InitialSpectrumWithInverse(params){

			const initialSpectrumWithInverse = InitialSpectrumWithInverseWGSL({ 
				writeSpectrum: textureStore(this.h0k_Texture),
				readSpectrum: texture(this.spectrumTexture),
				index: instanceIndex,
				size: params.size,
			}).compute(params.size ** 2);
			params.renderer.compute(initialSpectrumWithInverse, this.defaultWorkgroup);
		}


		Update() {
			this.params_.renderer.compute(this.initialSpectrum, this.defaultWorkgroup);
			this.params_.renderer.compute(this.initialSpectrumWithInverse, this.defaultWorkgroup);
		}

	}

	return {
		InitialSpectrum,
	};
  
})();





   
