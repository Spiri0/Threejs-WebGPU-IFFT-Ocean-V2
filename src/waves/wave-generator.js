import {THREE} from '../three-defs.js';
import {textureStore, instanceIndex} from "three/tsl";
import {entity} from '../entity.js';

import {wave_constants} from './wave-constants.js';
import {wave_cascade} from './wave-cascade.js';
import {butterflyWGSL} from "../../resources/shader/IFFT/butterfly.js";


export const wave_generator = (() => {

	class WaveGenerator extends entity.Component {
		constructor(params) {
			super();
			this.Init(params);
		}

		Init(params) {
			this.params_ = params;
 

			this.size = wave_constants.TEXTURE_SIZE;
			this.butterflyTexture = new THREE.StorageTexture(Math.log2(this.size), this.size);
			this.butterflyTexture.magFilter = this.butterflyTexture.minFilter = THREE.NearestFilter;
			this.butterflyTexture.type = THREE.FloatType;
  
			this.butterfly = butterflyWGSL({ 
				writeButterfly: textureStore(this.butterflyTexture), 
				index: instanceIndex,
				N: this.size,
			}).compute(Math.log2(this.size) * this.size);
			params.renderer.compute(this.butterfly, [1, 8, 1]);


			this.waveSettings = {
				...wave_constants.FIRST_WAVE_DATASET,
				...wave_constants.SECOND_WAVE_DATASET,
			}


			this.skySet = params.gui.addFolder("sky");
			this.waveSet1 = params.gui.addFolder("firstWaveSpectrum");
			this.waveSet2 = params.gui.addFolder("secondWaveSpectrum");
			this.waveSet3 = params.gui.addFolder("Foam");
			this.oceanSet = params.gui.addFolder("Ocean");
			var wave1Params = {};
			var wave2Params = {};

			for(const param in wave_constants.FIRST_WAVE_DATASET){
				if(wave_constants.FIRST_WAVE_DATASET.hasOwnProperty(param)){
					const paramBorders = wave_constants.FIRST_WAVE_BORDERS[param];
					wave1Params[param] = wave_constants.FIRST_WAVE_DATASET[param].value;
					this.waveSet1.add(wave1Params, param, paramBorders.min, paramBorders.max).onChange((value) => {
						wave_constants.FIRST_WAVE_DATASET[param].value = value;
						this.InitCascades();
						this.UpdateOceanMaterial();
					});
				}
			}
			for(const param in wave_constants.SECOND_WAVE_DATASET){
				if(wave_constants.SECOND_WAVE_DATASET.hasOwnProperty(param)){
					const paramBorders = wave_constants.SECOND_WAVE_BORDERS[param];
					wave2Params[param] = wave_constants.SECOND_WAVE_DATASET[param].value;
					this.waveSet2.add(wave2Params, param, paramBorders.min, paramBorders.max).onChange((value) => {
						wave_constants.SECOND_WAVE_DATASET[param].value = value;
						this.InitCascades();
						this.UpdateOceanMaterial();
					}); 
				}
			}
			this.waveSet3.add(wave_constants.FOAM_STRENGTH, "value", 0, 5).step(0.1).onChange((value) => {
				wave_constants.FOAM_STRENGTH.value = value;
				this.InitCascades();
				this.UpdateOceanMaterial();
			});
			this.waveSet3.add(wave_constants.FOAM_THRESHOLD, "value", 0, 5).step(0.1).onChange((value) => {
				wave_constants.FOAM_THRESHOLD.value = value;
				this.InitCascades();
				this.UpdateOceanMaterial();
			});
			this.oceanSet.add(wave_constants.LOD_SCALE, "value", 0, 20).step(0.1).onChange((value) => {
				wave_constants.LOD_SCALE.value = value;
				this.InitCascades();
				this.UpdateOceanMaterial();
			});


			this.cascades = [];

			this.foamStrength = wave_constants.FOAM_STRENGTH;
			this.foamThreshold = wave_constants.FOAM_THRESHOLD;
			this.lengthScale = wave_constants.LENGTH_SCALES;
			this.lambda = wave_constants.LAMBDA;
			this.lodScale = wave_constants.LOD_SCALE;

			this.InitCascades();
		}


		InitCascades() {

			this.cascades.length = 0;
			var boundaryLow = 0.0001;
			//cutoff condition to prevent small wavelengths from occurring in large cascades and large wavelengths from occurring in small cascades
			for(let i = 0; i < this.lengthScale.length; i++){
				const boundaryHigh = i < this.lengthScale.length - 1 ?  2 * Math.PI / this.lengthScale[i + 1] * 6 : 9999;
				this.cascades.push(new wave_cascade.WaveCascade({...this.params_, ...this.CascadeParams(i, boundaryLow, boundaryHigh)}));
				boundaryLow = boundaryHigh;
			}
		}


		CascadeParams(i, low, high){
			return{
				size: this.size, 
				butterfly: this.butterflyTexture,
				lengthScale: this.lengthScale[i],
				lambda: this.lambda[i],
				boundaryLow: low,
				boundaryHigh: high,
				waveSettings: this.waveSettings
			}
		}


		Update(dt) {
			for(let i = 0; i < this.cascades.length; i++){
				this.cascades[i].Update(dt);
			}
		}


		UpdateOceanMaterial() {
			const ocean = this.FindEntity('ocean').GetComponent('OceanChunkManager');
			ocean.material_.positionNode.parameters.displacement0.value = this.cascades[0].displacement;
			ocean.material_.positionNode.parameters.displacement1.value = this.cascades[1].displacement;
			ocean.material_.positionNode.parameters.displacement2.value = this.cascades[2].displacement;
			ocean.material_.positionNode.parameters.displacement3.value = this.cascades[3].displacement;
			ocean.material_.colorNode.parameters.derivatives0.value = this.cascades[0].derivative;
			ocean.material_.colorNode.parameters.derivatives1.value = this.cascades[1].derivative;
			ocean.material_.colorNode.parameters.derivatives2.value = this.cascades[2].derivative;
			ocean.material_.colorNode.parameters.derivatives3.value = this.cascades[3].derivative;
			ocean.material_.colorNode.parameters.jacobian0.value = this.cascades[0].jacobian;
			ocean.material_.colorNode.parameters.jacobian1.value = this.cascades[1].jacobian;
			ocean.material_.colorNode.parameters.jacobian2.value = this.cascades[2].jacobian;
			ocean.material_.colorNode.parameters.jacobian3.value = this.cascades[3].jacobian;
		}

	}

	return {
		WaveGenerator: WaveGenerator,
	};
  
})();



