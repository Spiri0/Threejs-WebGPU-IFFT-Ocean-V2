import {THREE} from '../three-defs.js';
import {BackSide, BoxGeometry, Mesh, Vector3, DoubleSide} from 'three';
import {MeshBasicNodeMaterial, MeshStandardNodeMaterial, wgslFn, uniform, attribute, varyingProperty, vec4} from 'three/nodes';
import {vertexStageWGSL} from  '../../resources/shader/sky/vertexStageWGSL.js';
import {fragmentStageWGSL} from  '../../resources/shader/sky/fragmentStageWGSL.js';




export const skybox = (() => {

	class Sky extends Mesh {
		constructor(params){

			const wgslShaderParams = {
				
				position: attribute("position"),
				normal: attribute("normal"),
				turbidity: uniform(2),
				rayleigh: uniform(1),
				mieCoefficient: uniform(0.005),
				mieDirectionalG: uniform(0.8),
				elevation: uniform(2),
				sunPosition: uniform(new Vector3(0, 0, 0)),
				up: uniform(new Vector3( 0, 1, 0 )),
				cameraPosition: uniform(new Vector3(0, 0, 0)),
				vSunfade: varyingProperty("float", "vSunfade"),
				vWorldPosition: varyingProperty("vec3", "vWorldPosition"),
				vSunDirection: varyingProperty("vec3", "vSunDirection"),
				vBetaR: varyingProperty("vec3", "vBetaR"),
				vBetaM: varyingProperty("vec3", "vBetaM"),
				vSunE: varyingProperty("float", "vSunE")
				
			}

			const material = new MeshBasicNodeMaterial();
			//material.positionNode = vertexStageWGSL.vertexStageWGSL(wgslShaderParams);
			//material.colorNode = vec4(0.5, 0, 0, 1);//fragmentStageWGSL(wgslShaderParams);
			material.colorNode = fragmentStageWGSL(wgslShaderParams);
			//material.side = BackSide;
			material.side = DoubleSide;
			//material.depthWrite = false;


			super(new BoxGeometry( 1, 1, 1 ), material);

		}


		Update() {

		}
	}

	return{
		Sky: Sky
	}
})();