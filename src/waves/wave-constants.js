import {THREE} from '../three-defs.js';
import {uniform} from "three/tsl";


export const wave_constants = (() => {
	
	const FIRST_WAVE_DATASET = {
		depth: uniform(20),
		scaleHeight: uniform(1),
		windSpeed: uniform(1),
		windDirection: uniform(0/360.0 * 2 * Math.PI),
		fetch: uniform(100000),
		spreadBlend: uniform(1),
		swell: uniform(0.198),
		peakEnhancement: uniform(3.3),
		shortWaveFade: uniform(0.0),
		fadeLimit: uniform(0.0),
	}
		
	const FIRST_WAVE_BORDERS = {
		depth: {min: 0.1, max: 100.0},
		scaleHeight: {min: 0.0, max: 1.0},
		windSpeed: {min: 0.01, max: 10.0},
		windDirection: {min: 0.0, max: 2 * Math.PI},
		fetch: {min: 10, max: 500000.0},
		spreadBlend: {min: 0.0, max: 1.0},
		swell: {min: 0.0, max: 1.0},
		peakEnhancement: {min: 1.0, max: 5.0},
		shortWaveFade: {min: 0.0, max: 5.0},
		fadeLimit: {min: 0.0, max: 1.0},
	}
		
	const SECOND_WAVE_DATASET = {
		d_depth: uniform(20),
		d_scaleHeight: uniform(1),
		d_windSpeed: uniform(1),
		d_windDirection: uniform(240/360.0 * 2 * Math.PI),
		d_fetch: uniform(300000),
		d_spreadBlend: uniform(1),
		d_swell: uniform(0.5),
		d_peakEnhancement: uniform(3.3),
		d_shortWaveFade: uniform(0.0),
		d_fadeLimit: uniform(0.0),
	}
		
	const SECOND_WAVE_BORDERS = {
		d_depth: {min: 0.1, max: 100.0},
		d_scaleHeight: {min: 0.0, max: 1.0},
		d_windSpeed: {min: 0.01, max: 10.0},
		d_windDirection: {min: 0.0, max: 2 * Math.PI},
		d_fetch: {min: 10, max: 500000.0},
		d_spreadBlend: {min: 0.0, max: 1.0},
		d_swell: {min: 0.0, max: 1.0},
		d_peakEnhancement: {min: 1.0, max: 5.0},
		d_shortWaveFade: {min: 0.0, max: 5.0},
		d_fadeLimit: {min: 0.0, max: 1.0},
	}
		
	return {
		DEFAULT_WORKGROUP: [8, 8, 1],
		TEXTURE_SIZE: 256,
		LENGTH_SCALES: [252, 17, 5],
		LAMBDA: [0.8, 0.8, 0.8],
		FOAM_STRENGTH: uniform(0.8),
		FOAM_THRESHOLD: uniform(2.5),
		FIRST_WAVE_DATASET,
		SECOND_WAVE_DATASET,
		FIRST_WAVE_BORDERS,
		SECOND_WAVE_BORDERS
		//More wave spectra are possible because waves are subject to the superposition principle
	}
    
})();
