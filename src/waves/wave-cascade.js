import {THREE, StorageTexture} from '../three-defs.js';
import {textureStore, instanceIndex, uniform, texture} from "three/nodes";
import {entity} from '../entity.js';
import {initial_spectrum} from './initial-spectrum.js';
import {TimeSpectrumWGSL} from "../../resources/shader/IFFT/timeSpectrum.js";
import {IFFT_HorizontalWGSL} from "../../resources/shader/IFFT/IFFT_Horizontal.js";
import {IFFT_VerticalWGSL} from "../../resources/shader/IFFT/IFFT_Vertical.js";
import {IFFT_PermuteWGSL} from "../../resources/shader/IFFT/IFFT_permute.js";
import {SetStorageTextureWGSL} from "../../resources/shader/IFFT/setStorageTexture.js";
import {TexturesMergerWGSL} from "../../resources/shader/IFFT/texturesMerger.js";
import {wave_constants} from './wave-constants.js';


export const wave_cascade = (() => {

	class WaveCascade extends entity.Component {
		constructor(params) {
			super();
			this.Init(params);
        	}

		Init(params) {
			this.params_ = params;
			this.defaultWorkgroup = wave_constants.DEFAULT_WORKGROUP;


			this.initialSpectrum = new initial_spectrum.InitialSpectrum(params);
			this.spectrumTexture = this.initialSpectrum.spectrumTexture;
			this.waveDataTexture = this.initialSpectrum.waveDataTexture;
			this.h0k_Texture = this.initialSpectrum.h0k_Texture;


			this.DxDz = new StorageTexture(params.size, params.size);
			this.DyDxz = new StorageTexture(params.size, params.size);
			this.DyxDyz = new StorageTexture(params.size, params.size);
			this.DxxDzz = new StorageTexture(params.size, params.size);
			this.pingTexture = new StorageTexture(params.size, params.size);
			this.pongTexture = new StorageTexture(params.size, params.size);

			this.DxDz.type = THREE.FloatType;
			this.DyDxz.type = THREE.FloatType;
			this.DyxDyz.type = THREE.FloatType;
			this.DxxDzz.type = THREE.FloatType;
			this.pingTexture.type = THREE.FloatType;
			this.pongTexture.type = THREE.FloatType;

			this.DxDz.magFilter = this.DxDz.minFilter = THREE.NearestFilter;
			this.DyDxz.magFilter = this.DyDxz.minFilter = THREE.NearestFilter;
			this.DyxDyz.magFilter = this.DyxDyz.minFilter = THREE.NearestFilter;
			this.DxxDzz.magFilter = this.DxxDzz.minFilter = THREE.NearestFilter;
			this.pingTexture.magFilter = this.pingTexture.minFilter = THREE.NearestFilter;
			this.pongTexture.magFilter = this.pongTexture.minFilter = THREE.NearestFilter;

            
            
			this.displacement = new StorageTexture(params.size, params.size);
			this.derivative = new StorageTexture(params.size, params.size);
			this.turbulence = new StorageTexture(params.size, params.size);
			this.jacobian = new StorageTexture(params.size, params.size);

			this.displacement.type = THREE.HalfFloatType;
			this.derivative.type = THREE.HalfFloatType;
			this.turbulence.type = THREE.FloatType;
			this.jacobian.type = THREE.FloatType;

			this.turbulence.minFilter = this.turbulence.magFilter = THREE.NearestFilter;

			this.displacement.generateMipmaps = true;
			this.derivative.generateMipmaps = true;
			this.jacobian.generateMipmaps = true;

			this.displacement.magFilter = THREE.LinearFilter;
			this.derivative.magFilter = THREE.LinearFilter;
			this.jacobian.magFilter = THREE.LinearFilter;

			this.displacement.minFilter = THREE.LinearMipMapLinearFilter;
			this.derivative.minFilter = THREE.LinearMipMapLinearFilter;
			this.jacobian.minFilter = THREE.LinearMipMapLinearFilter;

			this.turbulence.wrapS = this.turbulence.wrapT = THREE.RepeatWrapping;
			this.displacement.wrapS = this.displacement.wrapT = THREE.RepeatWrapping;
			this.derivative.wrapS = this.derivative.wrapT = THREE.RepeatWrapping;
			this.jacobian.wrapS = this.jacobian.wrapT = THREE.RepeatWrapping;
            

			this.displacement.anisotropy = this.params_.renderer.getMaxAnisotropy();
			this.derivative.anisotropy = this.params_.renderer.getMaxAnisotropy();
			this.jacobian.anisotropy = this.params_.renderer.getMaxAnisotropy();



			this.computeTimeSpectrum = TimeSpectrumWGSL({ 
				writeDxDz: textureStore(this.DxDz),
				writeDyDxz: textureStore(this.DyDxz),
				writeDyxDyz: textureStore(this.DyxDyz),
				writeDxxDzz: textureStore(this.DxxDzz),
				readSpectrum: texture(this.h0k_Texture),
				readWaveData: texture(this.waveDataTexture),
				index: instanceIndex,
				size: params.size,
				time: uniform(0)
			}).compute(params.size ** 2);
  
            
			//_________________Initialize pingTexture for the IFFT____________________

			this.computeInitStorageTextureX = SetStorageTextureWGSL({ 
				size: params.size,
				readTex: texture(this.DxDz),
				writeTex: textureStore(this.pingTexture),
				index: instanceIndex 
			}).compute(params.size ** 2);

			this.computeInitStorageTextureY = SetStorageTextureWGSL({ 
				size: params.size,
				readTex: texture(this.DyDxz),
				writeTex: textureStore(this.pingTexture),
				index: instanceIndex 
			}).compute(params.size ** 2);

			this.computeInitStorageTextureZ = SetStorageTextureWGSL({ 
				size: params.size,
				readTex: texture(this.DyxDyz),
				writeTex: textureStore(this.pingTexture),
				index: instanceIndex 
			}).compute(params.size ** 2);

			this.computeInitStorageTextureW = SetStorageTextureWGSL({ 
				size: params.size,
				readTex: texture(this.DxxDzz),
				writeTex: textureStore(this.pingTexture),
				index: instanceIndex 
			}).compute(params.size ** 2);


			this.computeTurbulenceTexture = SetStorageTextureWGSL({ 
				size: params.size,
				readTex: texture(this.jacobian),
				writeTex: textureStore(this.turbulence),
				index: instanceIndex 
			}).compute(params.size ** 2);


			//________________________________________________________________________


			//_________Initialize iteration uniform and IFFT compute Shaders__________

			this.ifftStep = uniform(0);

			this.computeHorizontalPing = IFFT_HorizontalWGSL({ 
				size: params.size,
				step: this.ifftStep,
				butterfly: texture(params.butterfly),
				readTex: texture(this.pingTexture),
				writeTex: textureStore(this.pongTexture),
				index: instanceIndex 
			}).compute(params.size ** 2);

			this.computeHorizontalPong = IFFT_HorizontalWGSL({ 
				size: params.size,
				step: this.ifftStep,
				butterfly: texture(params.butterfly),
				readTex: texture(this.pongTexture),
				writeTex: textureStore(this.pingTexture),
				index: instanceIndex 
			}).compute(params.size ** 2);

			this.computeVerticalPing = IFFT_VerticalWGSL({
				size: params.size,
				step: this.ifftStep,
				butterfly: texture(params.butterfly),
				readTex: texture(this.pingTexture),
				writeTex: textureStore(this.pongTexture),
				index: instanceIndex 
			}).compute(params.size ** 2);

			this.computeVerticalPong = IFFT_VerticalWGSL({
				size: params.size,
				step: this.ifftStep,
				butterfly: texture(params.butterfly),
				readTex: texture(this.pongTexture),
				writeTex: textureStore(this.pingTexture),
				index: instanceIndex 
			}).compute(params.size ** 2);

			//________________________________________________________________________


			//________________________IFFT Permute Shaders____________________________

			this.computePermuteX = IFFT_PermuteWGSL({ 
				size: params.size,
				readTex: texture(this.pingTexture),
				writeTex: textureStore(this.DxDz),
				index: instanceIndex 
			}).compute(params.size ** 2);

			this.computePermuteY = IFFT_PermuteWGSL({ 
				size: params.size,
				readTex: texture(this.pingTexture),
				writeTex: textureStore(this.DyDxz),
				index: instanceIndex 
			}).compute(params.size ** 2);

			this.computePermuteZ = IFFT_PermuteWGSL({ 
				size: params.size,
				readTex: texture(this.pingTexture),
				writeTex: textureStore(this.DyxDyz),
				index: instanceIndex 
			}).compute(params.size ** 2);

			this.computePermuteW = IFFT_PermuteWGSL({ 
				size: params.size,
				readTex: texture(this.pingTexture),
				writeTex: textureStore(this.DxxDzz),
				index: instanceIndex 
			}).compute(params.size ** 2);

			//________________________________________________________________________

 
			this.computeMergeTextures = TexturesMergerWGSL({ 
				size: params.size,
				index: instanceIndex,
				lambda: uniform(params.lambda),
				deltaTime: uniform(0),
				readDxDz: texture(this.DxDz),
				readDyDxz: texture(this.DyDxz),
				readDyxDyz: texture(this.DyxDyz),
				readDxxDzz: texture(this.DxxDzz),
				readTurbulence: texture(this.turbulence),
				writeDisplacement: textureStore(this.displacement),
				writeDerivative: textureStore(this.derivative),
				writeJacobian: textureStore(this.jacobian),
			}).compute(params.size ** 2);

		}
       

		Update(dt){

			this.computeTimeSpectrum.computeNode.parameters.time.value = performance.now() / 1000;
			this.params_.renderer.compute(this.computeTimeSpectrum, this.defaultWorkgroup);

			this.IFFT({...this.params_, direction: "y"});
			this.IFFT({...this.params_, direction: "x"});
			this.IFFT({...this.params_, direction: "z"});
			this.IFFT({...this.params_, direction: "w"});

			this.computeMergeTextures.computeNode.parameters.deltaTime.value = dt;
			this.params_.renderer.compute(this.computeMergeTextures, this.defaultWorkgroup);
			this.params_.renderer.compute(this.computeTurbulenceTexture, this.defaultWorkgroup);

		}


		IFFT(params){

			if(params.direction == "x")params.renderer.compute(this.computeInitStorageTextureX, this.defaultWorkgroup);
			if(params.direction == "y")params.renderer.compute(this.computeInitStorageTextureY, this.defaultWorkgroup);
			if(params.direction == "z")params.renderer.compute(this.computeInitStorageTextureZ, this.defaultWorkgroup);
			if(params.direction == "w")params.renderer.compute(this.computeInitStorageTextureW, this.defaultWorkgroup);

			let iterations = Math.log2(params.size);
			let pingpong = false;

			for(let i = 0; i < iterations; i++){
				pingpong = !pingpong;

				this.ifftStep.value = i;
				params.renderer.compute(pingpong ? this.computeHorizontalPing : this.computeHorizontalPong, this.defaultWorkgroup);
			}
			for(let i = 0; i < iterations; i++){
				pingpong = !pingpong;

				this.ifftStep.value = i;
				params.renderer.compute(pingpong ? this.computeVerticalPing : this.computeVerticalPong, this.defaultWorkgroup);
			}
 
			if(params.direction == "x")params.renderer.compute(this.computePermuteX, this.defaultWorkgroup);       
			if(params.direction == "y")params.renderer.compute(this.computePermuteY, this.defaultWorkgroup);
			if(params.direction == "z")params.renderer.compute(this.computePermuteZ, this.defaultWorkgroup);
			if(params.direction == "w")params.renderer.compute(this.computePermuteW, this.defaultWorkgroup);
		}

	}


	return {
		WaveCascade: WaveCascade,
	};
  
})();



