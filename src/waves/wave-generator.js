import {THREE} from '../three-defs.js';
import { instanceIndex, storage } from "three/tsl";
import {entity} from '../entity.js';
import {wave_constants} from './wave-constants.js';
import WaveCascade from './wave-cascade.js';
import {butterflyWGSL} from "../../resources/shader/IFFT/butterfly.js";


export const wave_generator = (() => {

	class WaveGenerator extends entity.Component {
		constructor(params) {
			super();
		}

		async Init(params) {
			this.params_ = params;
 
			this.size = wave_constants.TEXTURE_SIZE;

			this.butterflyBuffer = new THREE.StorageBufferAttribute( new Float32Array( Math.log2( this.size ) * this.size * 4 ), 4 );


			this.butterfly = butterflyWGSL({ 
				butterflyBuffer: storage( this.butterflyBuffer, 'vec4', this.butterflyBuffer.count ),
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

						for(let i in this.cascades){
							this.cascades[i].initialSpectrum.Update();
						}
					});
				}
			}
			for(const param in wave_constants.SECOND_WAVE_DATASET){
				if(wave_constants.SECOND_WAVE_DATASET.hasOwnProperty(param)){
					const paramBorders = wave_constants.SECOND_WAVE_BORDERS[param];
					wave2Params[param] = wave_constants.SECOND_WAVE_DATASET[param].value;
					this.waveSet2.add(wave2Params, param, paramBorders.min, paramBorders.max).onChange((value) => {
						wave_constants.SECOND_WAVE_DATASET[param].value = value;

						for(let i in this.cascades){
							this.cascades[i].initialSpectrum.Update();
						}
					}); 
				}
			}
			this.waveSet3.add(wave_constants.FOAM_STRENGTH, "value", 0, 5).step(0.1).onChange((value) => {
				wave_constants.FOAM_STRENGTH.value = value;
			});
			this.waveSet3.add(wave_constants.FOAM_THRESHOLD, "value", 0, 5).step(0.1).onChange((value) => {
				wave_constants.FOAM_THRESHOLD.value = value;
			});
			this.oceanSet.add(wave_constants.LOD_SCALE, "value", 0, 20).step(0.1).onChange((value) => {
				wave_constants.LOD_SCALE.value = value;
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
				this.cascades.push(new WaveCascade({...this.params_, ...this.CascadeParams(i, boundaryLow, boundaryHigh)}));
				boundaryLow = boundaryHigh;
			}
		}


		CascadeParams(i, low, high){
			return{
				size: this.size,
				noise: this.noise,
				lengthScale: this.lengthScale[i],
				lambda: this.lambda[i],
				boundaryLow: low,
				boundaryHigh: high,
				waveSettings: this.waveSettings,
				butterflyBuffer: this.butterflyBuffer
			}
		}


		async Update_(dt) {
			for(let i = 0; i < this.cascades.length; i++){
				await this.cascades[i].Update(dt);
			}
		}

	}

	return {
		WaveGenerator,
	};
  
})();



