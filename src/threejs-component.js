import {THREE, WebGPURenderer, WebGPU, RenderPass, ShaderPass, EffectComposer, CopyShader} from './three-defs.js';
import {MeshBasicNodeMaterial, texture} from "three/nodes";
import {entity} from "./entity.js";


export const threejs_component = (() => {
	
	class ThreeJSController extends entity.Component {
		constructor() {
			super();
		}
		
		InitEntity() {
			
			if (WebGPU.isAvailable() === false) {
				document.body.appendChild(WebGPU.getErrorMessage());
				throw new Error('Your Browser does not support WebGPU yet');
			}

			this.renderer_ = new WebGPURenderer({ 
				canvas: document.createElement('canvas'),
				antialias: true,
				forceWebGL: false
			});
    	
			this.renderer_.outputColorSpace = THREE.SRGBColorSpace;
			this.renderer_.setPixelRatio(window.devicePixelRatio);
			this.renderer_.shadowMap.enabled = true;
			this.renderer_.shadowMap.type = THREE.PCFSoftShadowMap;
			this.renderer_.physicallyCorrectLights = true;
			this.renderer_.domElement.id = 'threejs';


			this.container = document.getElementById('container');
			this.renderer_.setSize(this.container.clientWidth, this.container.clientHeight);
			this.container.appendChild( this.renderer_.domElement );
		

			const aspect = this.container.clientWidth / this.container.clientHeight; 
			const fov = 50;
			const near = 0.1;
			const far = 1E6;
			this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
			this.scene_ = new THREE.Scene();
			this.renderer_.setClearColor( 0x87CEEB );


			window.addEventListener('resize', () => {
				this.OnResize_();	
			}, false );
		}


		Render() {

			this.camera_.layers.enableAll();
			this.renderer_.render(this.scene_, this.camera_);
		}


		Update(timeElapsed) {

		}
    
    
		OnResize_() {
		
			const width = this.container.clientWidth;
			const height = this.container.clientHeight;
		
			this.camera_.aspect = width / height;
			this.camera_.updateProjectionMatrix();
			this.renderer_.setSize(width, height);	
		}
  
  	}//end class


  	return {
		ThreeJSController: ThreeJSController,
  	};

})();
